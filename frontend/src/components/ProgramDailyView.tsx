import { useI18n } from '../context/I18nContext';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import ReactDOM from 'react-dom';
import { apiFetch } from '../services/api';
import NoraCard from './shared/NoraCard';
import BreathingTimer from './programs/BreathingTimer';

const MOOD = [
  { val: 1, icon: 'ri-emotion-sad-line', label: 'Difficile', color: '#EF4444' },
  { val: 2, icon: 'ri-emotion-unhappy-line', label: 'Bof', color: '#F59E0B' },
  { val: 3, icon: 'ri-emotion-normal-line', label: 'OK', color: '#FCD34D' },
  { val: 4, icon: 'ri-emotion-line', label: 'Bien', color: '#34D399' },
  { val: 5, icon: 'ri-emotion-happy-line', label: 'Super', color: '#10B981' },
];

interface Props { token: string; onStop: () => void; }

/* ── Countdown Timer Component ── */
function CountdownTimer({ durationSec, color, icon, label, onComplete }: { durationSec: number; color: string; icon: string; label: string; onComplete: () => void }) {
  const { t } = useI18n();
  const [remaining, setRemaining] = useState(durationSec);
  const [running, setRunning] = useState(false);
  const ref = useRef<any>(null);

  useEffect(() => {
    if (!running) return;
    ref.current = setInterval(() => {
      setRemaining(p => {
        if (p <= 1) { clearInterval(ref.current); setRunning(false); onComplete(); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(ref.current);
  }, [running]);

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const pct = ((durationSec - remaining) / durationSec) * 100;

  return (
    <div data-testid="countdown-timer" style={{ padding: '16px', borderRadius: 18, background: `${color}08`, border: `1px solid ${color}15`, marginTop: 10 } as any}>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes timer-glow { 0%,100% { box-shadow: 0 0 20px ${color}15; } 50% { box-shadow: 0 0 40px ${color}30; } }` }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 } as any}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: `${color}12`, border: `1px solid ${color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: running ? 'timer-glow 2s ease-in-out infinite' : 'none' } as any}>
          <i className={icon} style={{ fontSize: 22, color }} />
        </div>
        <div style={{ flex: 1 } as any}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{label}</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#FFF', fontVariantNumeric: 'tabular-nums' } as any}>
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </div>
        </div>
        <div onClick={() => running ? (clearInterval(ref.current), setRunning(false)) : setRunning(true)}
          style={{ width: 44, height: 44, borderRadius: 14, background: running ? 'rgba(239,68,68,0.12)' : `${color}15`, border: `1px solid ${running ? 'rgba(239,68,68,0.25)' : `${color}25`}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
          <i className={running ? 'ri-pause-fill' : 'ri-play-fill'} style={{ fontSize: 20, color: running ? '#EF4444' : color }} />
        </div>
      </div>
      <div style={{ height: 4, borderRadius: 2, background: CB, overflow: 'hidden' } as any}>
        <div style={{ height: '100%', borderRadius: 2, background: `linear-gradient(90deg, ${color}, ${color}80)`, width: `${pct}%`, transition: 'width 1s linear' }} />
      </div>
    </div>
  );
}

/* ── Rep Counter Component ── */
function RepCounter({ target, color, icon, onComplete }: { target: number; color: string; icon: string; onComplete: () => void }) {
  const [count, setCount] = useState(0);
  const done = count >= target;

  const increment = () => {
    const next = count + 1;
    setCount(next);
    if (next >= target) onComplete();
  };

  return (
    <div data-testid="rep-counter" style={{ padding: '14px', borderRadius: 16, background: `${color}06`, border: `1px solid ${color}12`, marginTop: 10, display: 'flex', alignItems: 'center', gap: 14 } as any}>
      <div onClick={increment} style={{
        width: 54, height: 54, borderRadius: 16, background: done ? 'rgba(16,185,129,0.12)' : `${color}10`,
        border: `2px solid ${done ? 'rgba(16,185,129,0.3)' : `${color}25`}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: done ? 'default' : 'pointer',
        transition: 'all 200ms', transform: done ? 'scale(1)' : 'scale(1)',
      } as any}>
        {done
          ? <i className="ri-check-double-fill" style={{ fontSize: 24, color: '#10B981' }} />
          : <span style={{ fontSize: 22, fontWeight: 900, color }}>{count}</span>
        }
      </div>
      <div style={{ flex: 1 } as any}>
        <div style={{ fontSize: 13, fontWeight: 700, color: done ? '#10B981' : '#FFF' }}>
          {done ? 'Termine !' : `${count} / ${target}`}
        </div>
        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Tapez le cercle pour compter</div>
      </div>
      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap', maxWidth: 80 } as any}>
        {Array.from({ length: Math.min(target, 20) }).map((_, i) => (
          <div key={i} style={{ width: 6, height: 6, borderRadius: 3, background: i < count ? color : 'rgba(255,255,255,0.06)', transition: 'background 200ms' }} />
        ))}
      </div>
    </div>
  );
}

/* ── Rating Input ── */
function RatingInput({ max, color, onRate }: { max: number; color: string; onRate: (v: number) => void }) {
  const [val, setVal] = useState(0);
  return (
    <div data-testid="rating-input" style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 10 } as any}>
      {Array.from({ length: max }).map((_, i) => (
        <div key={i} onClick={() => { setVal(i + 1); onRate(i + 1); }}
          style={{ width: 40, height: 40, borderRadius: 12, background: i < val ? `${color}15` : 'rgba(255,255,255,0.04)', border: `1.5px solid ${i < val ? color : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 200ms', transform: i < val ? 'scale(1.05)' : 'scale(1)' } as any}>
          <i className={i < val ? 'ri-star-fill' : 'ri-star-line'} style={{ fontSize: 18, color: i < val ? color : 'rgba(255,255,255,0.2)', transition: 'color 200ms' }} />
        </div>
      ))}
    </div>
  );
}

/* ── Full-screen Exercise Popup ── */
function ExercisePopup({ task, steps, color, category, alreadyDone, onComplete, onClose }: { task: string; steps: any[]; color: string; category?: string; alreadyDone?: boolean; onComplete: (rating: number, notes?: Record<string, string>) => void; onClose: () => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [finished, setFinished] = useState(false);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [redoing, setRedoing] = useState(false);
  const hasSteps = steps && steps.length > 0;
  const totalSteps = hasSteps ? steps.length : 1;
  const showExercise = !alreadyDone || redoing;
  const advanceStep = () => { if (currentStep < totalSteps - 1) setCurrentStep(currentStep + 1); else setFinished(true); };
  const selectChoice = (choice: string) => { setNotes(prev => ({ ...prev, [`step_${currentStep}`]: choice })); setTimeout(() => advanceStep(), 300); };
  const step = hasSteps && currentStep < steps.length ? steps[currentStep] : null;
  const stepChoices = step?.choices || null;
  const evalOptions = [{v:1,l:'1',c:'#EF4444'},{v:2,l:'2',c:'#F59E0B'},{v:3,l:'3',c:'#FCD34D'},{v:4,l:'4',c:'#34D399'},{v:5,l:'5',c:'#10B981'}];

  const popup = (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.2)', overflowY: 'scroll', WebkitOverflowScrolling: 'touch' } as any}>
      <div style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: '70px 24px 120px', boxSizing: 'border-box' } as any}>
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
        {!showExercise ? (
          <div style={{ borderRadius: 24, background: CB2, border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '28px 24px', textAlign: 'center' } as any}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: `${color}12`, border: `1px solid ${color}25`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 } as any}>
              <i className="ri-checkbox-circle-fill" style={{ fontSize: 32, color }} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF', marginBottom: 6 }}>Action realisee</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 24, lineHeight: 1.5 }}>{task}</div>
            <div onClick={() => { setRedoing(true); setCurrentStep(0); setFinished(false); setNotes({}); }}
              style={{ padding: '15px', borderRadius: 16, background: `linear-gradient(135deg, ${color}30, ${color}15)`, border: `1px solid ${color}30`, textAlign: 'center', cursor: 'pointer', fontSize: 14, fontWeight: 900, color: '#FFF' } as any}>
              <i className="ri-repeat-line" style={{ fontSize: 14, marginRight: 8 }} />Recommencer
            </div>
          </div>
        ) : !finished ? (
          <>
            <div style={{ display: 'flex', gap: 4, marginBottom: 28 } as any}>
              {Array.from({ length: totalSteps }).map((_, si) => (
                <div key={si} style={{ flex: 1, height: 4, borderRadius: 2, background: si <= currentStep ? color : 'rgba(255,255,255,0.06)', transition: 'background 0.3s', boxShadow: si === currentStep ? `0 0 8px ${color}50` : 'none' } as any} />
              ))}
            </div>
            <div style={{ borderRadius: 24, background: CB2, border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '28px 24px', textAlign: 'center', marginBottom: 20 } as any}>
              {step ? (
                <>
                  <div style={{ width: 64, height: 64, borderRadius: 20, background: `${color}12`, border: `1px solid ${color}25`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 } as any}>
                    <i className={step.icon || 'ri-heart-pulse-line'} style={{ fontSize: 32, color }} />
                  </div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: T, lineHeight: 1.4, marginBottom: 8 }}>{step.instruction}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Etape {currentStep + 1} sur {totalSteps}</div>
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
                <div style={{ fontSize: 17, fontWeight: 800, color: T, lineHeight: 1.4 }}>{task}</div>
              )}
            </div>
            {!stepChoices && (
              <div onClick={advanceStep} style={{ padding: '15px', borderRadius: 16, background: `linear-gradient(135deg, ${color}45, ${color}20)`, border: `1px solid ${color}40`, textAlign: 'center', cursor: 'pointer', fontSize: 15, fontWeight: 900, color: '#FFF', boxShadow: `0 4px 20px ${color}25` } as any}>
                {currentStep < totalSteps - 1 ? t('next') : 'Terminer'}
              </div>
            )}
          </>
        ) : (
          <div style={{ borderRadius: 24, background: CB2, border: '1px solid rgba(255,255,255,0.12)', padding: '28px 24px', textAlign: 'center' } as any}>
            <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 } as any}>
              <i className="ri-checkbox-circle-fill" style={{ fontSize: 32, color: '#10B981' }} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: T, marginBottom: 16 }}>Termine !</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 8 } as any}>
              {evalOptions.map(o => (
                <div key={o.v} onClick={() => onComplete(o.v, notes)} style={{ width: 44, height: 44, borderRadius: 14, background: CB2, border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 18, fontWeight: 900, color: o.c } as any}>{o.l}</div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
  return Platform.OS === 'web' && typeof document !== 'undefined' ? ReactDOM.createPortal(popup, document.body) : popup;
}


export default function ProgramDailyView({ token, onStop }: Props) {
  const [data, setData] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [expandedTask, setExpandedTask] = useState<number | null>(null);
  const [showBreathing, setShowBreathing] = useState<{ pattern: string; dur: number } | null>(null);
  const [exercisePopup, setExercisePopup] = useState<any>(null);
  const [showCheckin, setShowCheckin] = useState(false);
  const [mood, setMood] = useState(0);
  const [checkinNote, setCheckinNote] = useState('');
  const [submittingCheckin, setSubmittingCheckin] = useState(false);
  const [isDark] = useState(() => typeof localStorage !== 'undefined' ? localStorage.getItem('chutex_dark') === '1' : false);

  // Theme constants for light/dark mode
  const T = isDark ? '#FFF' : '#1A1A2E';
  const S = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)';
  const S2 = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)';
  const S3 = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)';
  const S4 = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)';
  const S5 = isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.45)';
  const S6 = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)';
  const S1 = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)';
  const CB = isDark ? 'rgba(255,255,255,0.03)' : '#F4F4F5';
  const CB2 = isDark ? 'rgba(255,255,255,0.06)' : '#EBEBED';
  const BB = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';
  const BB2 = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)';
  const BB3 = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';
  const INP_BG = isDark ? 'rgba(255,255,255,0.06)' : '#F4F4F5';
  const INP_BORDER = isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)';

  const g = { backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' };

  const fetchActive = useCallback(async () => {
    try {
      const res = await apiFetch('/api/programs/active', {}, token);
      if (res?.active) setData(res);
    } catch {}
  }, [token]);

  const fetchLeaderboard = useCallback(async () => {
    try {
      const res = await apiFetch('/api/programs/team/leaderboard', {}, token);
      if (res?.leaderboard) setLeaderboard(res.leaderboard);
    } catch {}
  }, [token]);

  useEffect(() => { fetchActive(); fetchLeaderboard(); }, [fetchActive, fetchLeaderboard]);

  if (!data) return null;

  const { program: prog, current_day: day, current_phase: phase, today_tasks: tt, today_checkin: checkin, task_progress: tp, streak, progress_pct, team } = data;
  const clr = prog?.color || '#A78BFA';
  const tasks = tt?.tasks || [];
  const interactive = tt?.interactive || [];
  const doneIndices = tp?.tasks_done_indices || [];

  const allTasksDone = tasks.length > 0 && doneIndices.length >= tasks.length;

  const saveTask = async (idx: number, rating = 0, notes: Record<string, string> = {}) => {
    try {
      await apiFetch('/api/programs/save-task', { method: 'POST', body: JSON.stringify({ task_index: idx, rating, notes }) }, token);
      await fetchActive();
    } catch {}
  };

  const submitCheckin = async () => {
    if (!mood) return;
    setSubmittingCheckin(true);
    try {
      await apiFetch('/api/programs/checkin', { method: 'POST', body: JSON.stringify({ mood, note: checkinNote }) }, token);
      await fetchActive();
      setShowCheckin(false);
    } catch {} finally { setSubmittingCheckin(false); }
  };

  const stopProgram = async () => {
    if (!confirm('Arreter le programme ? Votre progression sera conservee.')) return;
    try {
      await apiFetch('/api/programs/stop', { method: 'POST' }, token);
      onStop();
    } catch {}
  };

  return (
    <div data-testid="program-daily-view" style={{ fontFamily: "'Inter', system-ui, sans-serif" } as any}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes pdv-fade { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes pdv-pulse { 0%,100% { opacity: 0.6; } 50% { opacity: 1; } }
        @keyframes pdv-check { from { transform: scale(0.5); opacity:0; } to { transform: scale(1); opacity:1; } }
        @keyframes pdv-progress { from { width: 0; } }
        @keyframes pdv-glow { 0%,100% { box-shadow: 0 0 20px ${clr}10; } 50% { box-shadow: 0 0 40px ${clr}25; } }
        @keyframes pdv-shake { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-2px); } 75% { transform: translateX(2px); } }
      `}} />

      {/* ═══ HEADER: Day + Phase + Progress ═══ */}
      <div data-testid="program-header" style={{ padding: '20px', borderRadius: 22, background: CB, border: `1px solid ${BB}`, marginBottom: 14, animation: 'pdv-fade 400ms ease' } as any}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 } as any}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}>
            <div style={{ width: 48, height: 48, borderRadius: 16, background: `${clr}12`, border: `1.5px solid ${clr}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
              <i className={prog.icon} style={{ fontSize: 24, color: clr }} />
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: clr, textTransform: 'uppercase', letterSpacing: 1 } as any}>Jour {day} / {prog.duration_days}</div>
              <div style={{ fontSize: 16, fontWeight: 900, color: T }}>{prog.title}</div>
            </div>
          </div>
          {streak > 0 && (
            <div style={{ padding: '6px 12px', borderRadius: 10, background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.2)', display: 'flex', alignItems: 'center', gap: 5 } as any}>
              <i className="ri-fire-fill" style={{ fontSize: 14, color: '#FBBF24' }} />
              <span style={{ fontSize: 12, fontWeight: 900, color: '#FBBF24' }}>{streak}</span>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div style={{ height: 6, borderRadius: 3, background: isDark ? 'rgba(255,255,255,0.04)' : '#E5E7EB', overflow: 'hidden', marginBottom: 8 } as any}>
          <div style={{ height: '100%', borderRadius: 3, background: `linear-gradient(90deg, ${clr}, ${clr}80)`, width: `${progress_pct}%`, animation: 'pdv-progress 1s ease' } as any} />
        </div>

        {/* Phase pill */}
        {phase && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}>
            <div style={{ width: 8, height: 8, borderRadius: 4, background: phase.color || clr }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: S2 }}>{phase.name}</span>
            <span style={{ fontSize: 10, color: S1 }}>•</span>
            <span style={{ fontSize: 10, color: S6 }}>{phase.description}</span>
          </div>
        )}
      </div>

      {/* ═══ MISSION DU JOUR ═══ */}
      {tt?.focus && (
        <div data-testid="daily-focus" style={{ padding: '18px', borderRadius: 20, background: `linear-gradient(135deg, ${clr}08, ${clr}03)`, border: `1px solid ${clr}15`, ...g, marginBottom: 14, animation: 'pdv-fade 400ms ease 100ms both' } as any}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 } as any}>
            <i className="ri-focus-3-line" style={{ fontSize: 16, color: clr }} />
            <span style={{ fontSize: 12, fontWeight: 900, color: clr, textTransform: 'uppercase', letterSpacing: 0.5 } as any}>Mission du jour</span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color: T, lineHeight: 1.4, marginBottom: 8 }}>{tt.focus}</div>
          {tt.mission && <div style={{ fontSize: 12, color: S2, lineHeight: 1.6 }}>{tt.mission}</div>}
        </div>
      )}

      {/* ═══ ACTIONS DU JOUR ═══ */}
      <div data-testid="daily-tasks" style={{ marginBottom: 14, animation: 'pdv-fade 400ms ease 200ms both' } as any}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, padding: '0 4px' } as any}>
          <i className="ri-list-check-3" style={{ fontSize: 16, color: S4 }} />
          <span style={{ fontSize: 12, fontWeight: 900, color: S, textTransform: 'uppercase', letterSpacing: 0.5 } as any}>Actions</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: clr, padding: '2px 8px', borderRadius: 99, background: `${clr}10`, border: `1px solid ${clr}15` }}>
            {doneIndices.length}/{tasks.length}
          </span>
        </div>

        {tasks.map((task: string, idx: number) => {
          const done = doneIndices.includes(idx);
          const inter = interactive[idx] || { type: 'action' };
          const expanded = expandedTask === idx;
          const hasGuidedSteps = tt?.guided_steps?.[String(idx)]?.length > 0;
          const taskIcon = inter.icon || 'ri-checkbox-blank-circle-line';

          return (
            <div key={idx} data-testid={`task-${idx}`}
              style={{ marginBottom: 8, borderRadius: 18, background: done ? 'rgba(16,185,129,0.04)' : CB, border: `1px solid ${done ? 'rgba(16,185,129,0.15)' : expanded ? `${clr}20` : BB2}`, overflow: 'hidden', transition: 'all 300ms', animation: `pdv-fade 300ms ease ${200 + idx * 80}ms both` } as any}>
              {/* Task header */}
              <div onClick={() => {
                if (done) return;
                if (inter.type === 'breathing') {
                  setShowBreathing({ pattern: inter.pattern || '5-5', dur: inter.duration_sec || 300 });
                } else if (hasGuidedSteps) {
                  setExercisePopup({ task, steps: tt.guided_steps[String(idx)], idx, color: clr, done });
                } else if (inter.type === 'action') {
                  saveTask(idx);
                } else {
                  setExpandedTask(expanded ? null : idx);
                }
              }}
                style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, cursor: done ? 'default' : 'pointer' } as any}>
                {/* Status icon */}
                <div style={{
                  width: 36, height: 36, borderRadius: 12, flexShrink: 0,
                  background: done ? 'rgba(16,185,129,0.12)' : `${clr}08`,
                  border: `1.5px solid ${done ? 'rgba(16,185,129,0.25)' : `${clr}15`}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  animation: done ? 'pdv-check 300ms ease' : 'none',
                } as any}>
                  {done
                    ? <i className="ri-check-line" style={{ fontSize: 18, color: '#10B981' }} />
                    : <i className={taskIcon} style={{ fontSize: 16, color: clr }} />
                  }
                </div>
                {/* Task text */}
                <div style={{ flex: 1, minWidth: 0 } as any}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: done ? S : T, textDecoration: done ? 'line-through' : 'none', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: expanded ? 99 : 2, WebkitBoxOrient: 'vertical' } as any}>
                    {task}
                  </div>
                  {inter.type !== 'action' && !done && (
                    <div style={{ fontSize: 10, fontWeight: 700, color: clr, marginTop: 3, display: 'flex', alignItems: 'center', gap: 4 } as any}>
                      <i className={inter.icon || 'ri-play-circle-line'} style={{ fontSize: 11 }} />
                      {inter.label}
                      {inter.type === 'timer' && inter.duration_sec ? ` • ${Math.round(inter.duration_sec / 60)} min` : ''}
                    </div>
                  )}
                </div>
                {/* Action indicator */}
                {!done && inter.type !== 'action' && (
                  <div style={{ width: 30, height: 30, borderRadius: 10, background: `${clr}08`, border: `1px solid ${clr}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                    <i className={inter.type === 'breathing' ? 'ri-lungs-line' : inter.type === 'timer' ? 'ri-play-fill' : inter.type === 'counter' ? 'ri-add-line' : 'ri-arrow-right-s-line'} style={{ fontSize: 14, color: clr }} />
                  </div>
                )}
              </div>

              {/* Expanded interactive content */}
              {expanded && !done && (
                <div style={{ padding: '0 16px 16px', animation: 'pdv-fade 200ms ease' } as any}>
                  {inter.type === 'timer' && (
                    <CountdownTimer durationSec={inter.duration_sec || 60} color={clr} icon={inter.icon || 'ri-timer-line'} label={inter.label || 'Chronometre'} onComplete={() => saveTask(idx)} />
                  )}
                  {inter.type === 'counter' && (
                    <RepCounter target={inter.target || 10} color={clr} icon={inter.icon || 'ri-repeat-line'} onComplete={() => saveTask(idx)} />
                  )}
                  {inter.type === 'rating' && (
                    <div style={{ padding: '14px', borderRadius: 16, background: CB, border: `1px solid ${BB2}`, marginTop: 8 } as any}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 8, textAlign: 'center' }}>Votre evaluation</div>
                      <RatingInput max={inter.max || 5} color={clr} onRate={(v) => saveTask(idx, v)} />
                    </div>
                  )}
                  {inter.type === 'data_input' && (
                    <div style={{ padding: '14px', borderRadius: 16, background: CB, border: `1px solid ${BB2}`, marginTop: 8 } as any}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>{inter.label}</div>
                      <div style={{ display: 'flex', gap: 8 } as any}>
                        <input data-testid={`input-${inter.field}`} type={inter.input_type || 'text'} placeholder={inter.input_type === 'time' ? '22:30' : 'Entrez la valeur'}
                          style={{ flex: 1, padding: '12px 14px', borderRadius: 12, background: INP_BG, border: `1px solid ${INP_BORDER}`, color: T, fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' } as any}
                          onKeyDown={(e: any) => { if (e.key === 'Enter') saveTask(idx, 0, { [inter.field]: e.target.value }); }}
                        />
                        <div onClick={(e: any) => { const input = e.currentTarget.previousSibling; if (input?.value) saveTask(idx, 0, { [inter.field]: input.value }); }}
                          style={{ width: 44, height: 44, borderRadius: 12, background: `${clr}15`, border: `1px solid ${clr}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 } as any}>
                          <i className="ri-check-line" style={{ fontSize: 18, color: clr }} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ═══ CHECK-IN / BILAN (just below actions) ═══ */}
      {!checkin ? (
        <div data-testid="checkin-section" style={{ padding: '20px', borderRadius: 22, background: allTasksDone ? `linear-gradient(135deg, ${clr}08, ${clr}03)` : CB, border: `1px solid ${allTasksDone ? `${clr}20` : BB2}`, marginBottom: 14, animation: 'pdv-fade 400ms ease 450ms both' } as any}>
          {!showCheckin ? (
            <div onClick={() => setShowCheckin(true)} style={{ display: 'flex', alignItems: 'center', gap: 14, cursor: 'pointer' } as any}>
              <div style={{ width: 48, height: 48, borderRadius: 16, background: allTasksDone ? `${clr}12` : 'rgba(255,255,255,0.04)', border: `1.5px solid ${allTasksDone ? `${clr}25` : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: allTasksDone ? 'pdv-pulse 2s ease-in-out infinite' : 'none' } as any}>
                <i className="ri-checkbox-circle-line" style={{ fontSize: 24, color: allTasksDone ? clr : 'rgba(255,255,255,0.2)' }} />
              </div>
              <div style={{ flex: 1 } as any}>
                <div style={{ fontSize: 14, fontWeight: 800, color: allTasksDone ? T : S5 }}>Bilan du jour</div>
                <div style={{ fontSize: 11, color: S4, marginTop: 2 }}>
                  {allTasksDone ? 'Toutes les actions sont faites ! Faites votre bilan' : `${doneIndices.length}/${tasks.length} actions faites — completez pour debloquer`}
                </div>
              </div>
              <i className="ri-arrow-right-s-line" style={{ fontSize: 20, color: allTasksDone ? clr : 'rgba(255,255,255,0.1)' }} />
            </div>
          ) : (
            <div style={{ animation: 'pdv-fade 300ms ease' } as any}>
              <div style={{ fontSize: 14, fontWeight: 800, color: T, marginBottom: 14, textAlign: 'center' }}>Comment vous sentez-vous ?</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 } as any}>
                {MOOD.map(m => (
                  <div key={m.val} onClick={() => setMood(m.val)}
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '12px 8px', borderRadius: 16, background: mood === m.val ? `${m.color}15` : 'rgba(255,255,255,0.03)', border: `1.5px solid ${mood === m.val ? m.color : 'rgba(255,255,255,0.06)'}`, transition: 'all 200ms', minWidth: 52 } as any}>
                    <i className={m.icon} style={{ fontSize: 24, color: mood === m.val ? m.color : 'rgba(255,255,255,0.15)', transition: 'color 200ms' }} />
                    <span style={{ fontSize: 9, fontWeight: 700, color: mood === m.val ? m.color : S6 }}>{m.label}</span>
                  </div>
                ))}
              </div>
              <textarea data-testid="checkin-note" value={checkinNote} onChange={(e: any) => setCheckinNote(e.target.value)}
                placeholder="Une note sur votre journee ? (optionnel)"
                style={{ width: '100%', minHeight: 60, padding: '12px 14px', borderRadius: 14, background: INP_BG, border: `1px solid ${INP_BORDER}`, color: T, fontSize: 13, fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box', marginBottom: 12 } as any} />
              <div style={{ display: 'flex', gap: 8 } as any}>
                <div onClick={() => setShowCheckin(false)} style={{ flex: 1, padding: '14px', borderRadius: 14, background: CB, border: `1px solid ${BB}`, textAlign: 'center', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: S } as any}>Annuler</div>
                <div data-testid="checkin-submit" onClick={submitCheckin}
                  style={{ flex: 2, padding: '14px', borderRadius: 14, background: mood ? `linear-gradient(135deg, ${clr}35, ${clr}15)` : CB, border: `1px solid ${mood ? `${clr}40` : BB2}`, textAlign: 'center', cursor: mood ? 'pointer' : 'not-allowed', fontSize: 14, fontWeight: 900, color: mood ? T : S6, opacity: submittingCheckin ? 0.6 : 1 } as any}>
                  {submittingCheckin ? 'Envoi...' : 'Valider le bilan'}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div data-testid="checkin-done" style={{ padding: '16px', borderRadius: 18, background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.12)', ...g, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 12, animation: 'pdv-fade 400ms ease 450ms both' } as any}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
            <i className="ri-checkbox-circle-fill" style={{ fontSize: 20, color: '#10B981' }} />
          </div>
          <div style={{ flex: 1 } as any}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#10B981' }}>Bilan du jour valide</div>
            <div style={{ fontSize: 11, color: S3, marginTop: 2 }}>
              Humeur : {MOOD.find(m => m.val === checkin.mood)?.label || '?'} • {doneIndices.length} actions
            </div>
          </div>
        </div>
      )}

      {/* ═══ TIP DU JOUR ═══ */}
      {tt?.tip && (
        <div style={{ padding: '14px 16px', borderRadius: 16, background: 'rgba(251,191,36,0.04)', border: '1px solid rgba(251,191,36,0.1)', marginBottom: 14, display: 'flex', gap: 10, animation: 'pdv-fade 400ms ease 300ms both' } as any}>
          <div style={{ width: 28, height: 28, borderRadius: 10, background: 'rgba(251,191,36,0.1)', border: '1px solid rgba(251,191,36,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
            <i className="ri-lightbulb-line" style={{ fontSize: 14, color: '#FBBF24' }} />
          </div>
          <div style={{ fontSize: 12, color: S2, lineHeight: 1.6 }}>{tt.tip}</div>
        </div>
      )}

      {/* ═══ CONSEIL NORA ═══ */}
      {tt?.tip && <NoraCard title="Conseil de Nora" text={tt.tip} />}

      {/* ═══ EQUIPE ═══ */}
      {team && team.members && team.members.length > 1 && (
        <div data-testid="team-progress-section" style={{ padding: '18px', borderRadius: 22, background: 'rgba(167,139,250,0.04)', border: '1px solid rgba(167,139,250,0.12)', marginBottom: 14, animation: 'pdv-fade 400ms ease 350ms both', ...g } as any}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 } as any}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
              <div style={{ width: 24, height: 24, borderRadius: 8, background: 'rgba(167,139,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                <i className="ri-team-line" style={{ fontSize: 13, color: '#A78BFA' }} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 900, color: T }}>Votre equipe</span>
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(167,139,250,0.6)', padding: '3px 10px', borderRadius: 99, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)' }}>
              {team.members.filter((m: any) => m.checked_in_today).length}/{team.members.length} check-ins
            </span>
          </div>
          {team.members.map((m: any, i: number) => {
            const initials = m.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 2);
            const moodObj = m.mood_today ? MOOD.find(mo => mo.val === m.mood_today) : null;
            return (
              <div key={i} data-testid={`team-member-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 16, background: m.is_me ? 'rgba(167,139,250,0.06)' : 'rgba(255,255,255,0.02)', border: `1px solid ${m.is_me ? 'rgba(167,139,250,0.12)' : 'rgba(255,255,255,0.04)'}`, marginBottom: i < team.members.length - 1 ? 6 : 0 } as any}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: m.checked_in_today ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.06)', border: `1.5px solid ${m.checked_in_today ? 'rgba(16,185,129,0.25)' : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 13, fontWeight: 900, color: m.checked_in_today ? '#10B981' : 'rgba(255,255,255,0.3)' } as any}>
                  {initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: T, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as any}>{m.name}</span>
                    {m.is_me && <span style={{ fontSize: 8, fontWeight: 800, color: '#A78BFA', padding: '1px 6px', borderRadius: 99, background: 'rgba(167,139,250,0.12)' }}>Vous</span>}
                  </div>
                  <div style={{ fontSize: 10, color: S2, marginTop: 2 } as any}>
                    {m.checked_in_today
                      ? <span style={{ color: 'rgba(16,185,129,0.7)' }}>{m.tasks_done_today} action{m.tasks_done_today !== 1 ? 's' : ''} validee{m.tasks_done_today !== 1 ? 's' : ''}</span>
                      : 'Pas encore fait aujourd\'hui'}
                  </div>
                </div>
                {moodObj && (
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: `${moodObj.color}12`, border: `1px solid ${moodObj.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                    <i className={moodObj.icon} style={{ fontSize: 16, color: moodObj.color }} />
                  </div>
                )}
                {m.checked_in_today ? (
                  <div style={{ width: 22, height: 22, borderRadius: 7, background: 'rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                    <i className="ri-check-line" style={{ fontSize: 13, color: '#10B981' }} />
                  </div>
                ) : (
                  <div style={{ width: 22, height: 22, borderRadius: 7, background: CB, border: `1px solid ${BB}`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                    <i className="ri-time-line" style={{ fontSize: 12, color: S6 }} />
                  </div>
                )}
              </div>
            );
          })}
          <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 10, background: 'rgba(167,139,250,0.04)', border: '1px solid rgba(167,139,250,0.08)', display: 'flex', alignItems: 'center', gap: 6 } as any}>
            <i className="ri-key-2-line" style={{ fontSize: 12, color: 'rgba(167,139,250,0.5)' }} />
            <span style={{ fontSize: 10, color: S4 }}>Code equipe: <strong style={{ color: '#A78BFA', letterSpacing: 1 }}>{team.invite_code}</strong></span>
          </div>
        </div>
      )}

      {/* ═══ LEADERBOARD ═══ */}
      {leaderboard.length > 1 && (
        <div data-testid="team-leaderboard" style={{ padding: '18px', borderRadius: 22, background: 'rgba(251,191,36,0.03)', border: '1px solid rgba(251,191,36,0.1)', marginBottom: 14, animation: 'pdv-fade 400ms ease 400ms both', ...g } as any}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 } as any}>
            <div style={{ width: 24, height: 24, borderRadius: 8, background: 'rgba(251,191,36,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
              <i className="ri-trophy-line" style={{ fontSize: 13, color: '#FBBF24' }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 900, color: T }}>Classement</span>
          </div>
          {leaderboard.map((m: any, i: number) => {
            const medal = i === 0 ? { c: '#FBBF24', i: 'ri-medal-fill' } : i === 1 ? { c: '#94A3B8', i: 'ri-medal-line' } : { c: '#B45309', i: 'ri-medal-line' };
            return (
              <div key={i} data-testid={`leaderboard-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 14, background: m.is_me ? 'rgba(251,191,36,0.05)' : 'transparent', border: `1px solid ${m.is_me ? 'rgba(251,191,36,0.1)' : 'transparent'}`, marginBottom: 4 } as any}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: `${medal.c}12`, border: `1px solid ${medal.c}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                  {i < 3 ? <i className={medal.i} style={{ fontSize: 14, color: medal.c }} /> : <span style={{ fontSize: 12, fontWeight: 900, color: S4 }}>{m.rank}</span>}
                </div>
                <div style={{ flex: 1 } as any}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: m.is_me ? '#FBBF24' : T }}>{m.name} {m.is_me ? '(vous)' : ''}</div>
                  <div style={{ fontSize: 10, color: S3 }}>{m.streak} jours • {m.tasks_done} actions</div>
                </div>
                <div style={{ fontSize: 16, fontWeight: 900, color: medal.c }}>{m.score}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ CONTROLS ═══ */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, animation: 'pdv-fade 400ms ease 500ms both' } as any}>
        <div onClick={stopProgram} data-testid="stop-program-btn" style={{ flex: 1, padding: '12px', borderRadius: 14, background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.1)', textAlign: 'center', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: 'rgba(239,68,68,0.5)' } as any}>
          <i className="ri-stop-circle-line" style={{ fontSize: 13, marginRight: 6 }} />Arreter le programme
        </div>
      </div>

      {/* ═══ BREATHING OVERLAY ═══ */}
      {showBreathing && (
        <BreathingTimer
          pattern={showBreathing.pattern}
          durationSec={showBreathing.dur}
          color={clr}
          onComplete={() => { setShowBreathing(null); }}
          onClose={() => setShowBreathing(null)}
        />
      )}

      {/* ═══ EXERCISE POPUP ═══ */}
      {exercisePopup && (
        <ExercisePopup
          task={exercisePopup.task}
          steps={exercisePopup.steps}
          color={exercisePopup.color}
          alreadyDone={exercisePopup.done}
          onComplete={(rating, notes) => {
            saveTask(exercisePopup.idx, rating, notes);
            setExercisePopup(null);
          }}
          onClose={() => setExercisePopup(null)}
        />
      )}
    </div>
  );
}
