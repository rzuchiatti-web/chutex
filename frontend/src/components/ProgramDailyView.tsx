import React, { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { apiFetch } from '../services/api';

const MOOD_EMOJIS = [
  { val: 1, icon: 'ri-emotion-sad-line', label: 'Difficile', color: '#EF4444' },
  { val: 2, icon: 'ri-emotion-unhappy-line', label: 'Bof', color: '#F59E0B' },
  { val: 3, icon: 'ri-emotion-normal-line', label: 'Correct', color: '#FCD34D' },
  { val: 4, icon: 'ri-emotion-line', label: 'Bien', color: '#34D399' },
  { val: 5, icon: 'ri-emotion-happy-line', label: 'Super', color: '#10B981' },
];

interface Props { token: string; onStop: () => void; }

export default function ProgramDailyView({ token, onStop }: Props) {
  const [data, setData] = useState<any>(null);
  const [tasksDone, setTasksDone] = useState<string[]>([]);
  const [mood, setMood] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [showStop, setShowStop] = useState(false);

  const fetchActive = useCallback(async () => {
    const res = await apiFetch('/api/programs/active', {}, token).catch(() => null);
    if (res) {
      setData(res);
      if (res.today_checkin) {
        setCheckedIn(true);
        setTasksDone(res.today_checkin.tasks_done || []);
      }
    }
  }, [token]);

  useEffect(() => { fetchActive(); }, [fetchActive]);

  const toggleTask = (task: string) => {
    if (checkedIn) return;
    setTasksDone(prev => prev.includes(task) ? prev.filter(t => t !== task) : [...prev, task]);
  };

  const submitCheckin = async () => {
    if (mood === 0 || submitting) return;
    setSubmitting(true);
    try {
      await apiFetch('/api/programs/checkin', { method: 'POST', body: JSON.stringify({ mood, tasks_done: tasksDone }) }, token);
      setCheckedIn(true);
      fetchActive();
    } catch {}
    setSubmitting(false);
  };

  const stopProgram = async () => {
    await apiFetch('/api/programs/stop', { method: 'POST' }, token).catch(() => {});
    onStop();
  };

  if (!data?.active || Platform.OS !== 'web') return null;

  const pg = data.program;
  const tt = data.today_tasks || {};
  const cd = data.current_day;
  const dur = pg?.duration_days || 21;
  const clr = pg?.color || '#A78BFA';
  const pct = Math.round((cd / dur) * 100);
  const phase = data.current_phase;
  const glass = { backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' };

  return (
    <div data-testid="program-daily-view">

      {/* ═══ HERO — Jour + Programme ═══ */}
      <div style={{ padding: '20px', borderRadius: 22, background: `${clr}08`, border: `1px solid ${clr}20`, marginBottom: 12, ...glass } as any}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 } as any}>
          <div style={{ width: 48, height: 48, borderRadius: 16, background: `${clr}15`, border: `1px solid ${clr}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
            <i className={pg.icon || 'ri-heart-pulse-line'} style={{ fontSize: 24, color: clr }} />
          </div>
          <div style={{ flex: 1 } as any}>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#FFF' }}>{pg.title}</div>
            <div style={{ fontSize: 12, color: clr, fontWeight: 700 }}>
              {phase?.name || 'Phase en cours'} — Jour {cd}/{dur}
            </div>
          </div>
          <div style={{ textAlign: 'center' } as any}>
            <div style={{ fontSize: 22, fontWeight: 900, color: clr }}>{pct}%</div>
          </div>
        </div>
        {/* Progress bar */}
        <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' } as any}>
          <div style={{ height: 6, borderRadius: 3, width: `${pct}%`, background: `linear-gradient(90deg, ${clr}80, ${clr})`, transition: 'width 0.5s' } as any} />
        </div>
      </div>

      {/* ═══ MISSION DU JOUR ═══ */}
      <div style={{ padding: '20px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 12, ...glass } as any}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 } as any}>
          <i className="ri-focus-3-line" style={{ fontSize: 16, color: clr }} />
          <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1 }}>Objectif du jour</span>
        </div>
        <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF', marginBottom: 8, lineHeight: 1.3 }}>{tt.focus || 'Mission du jour'}</div>
        {tt.mission && (
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, marginBottom: 4 }}>{tt.mission}</div>
        )}
      </div>

      {/* ═══ ACTIONS A FAIRE ═══ */}
      <div style={{ padding: '18px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 12, ...glass } as any}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 } as any}>
          <i className="ri-checkbox-circle-line" style={{ fontSize: 16, color: '#10B981' }} />
          <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1 }}>Actions du jour</span>
          {tt.tasks && <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: tasksDone.length === tt.tasks.length ? '#10B981' : 'rgba(255,255,255,0.25)' }}>{tasksDone.length}/{tt.tasks.length}</span>}
        </div>
        {(tt.tasks || []).map((task: string, i: number) => {
          const done = tasksDone.includes(task);
          return (
            <div key={i} onClick={() => toggleTask(task)} data-testid={`task-${i}`}
              style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 14px', borderRadius: 14, marginBottom: 6, cursor: checkedIn ? 'default' : 'pointer', background: done ? `${clr}08` : 'rgba(255,255,255,0.02)', border: `1px solid ${done ? clr + '25' : 'rgba(255,255,255,0.05)'}`, transition: 'all 200ms' } as any}>
              <div style={{ width: 24, height: 24, borderRadius: 8, border: `2px solid ${done ? clr : 'rgba(255,255,255,0.15)'}`, background: done ? `${clr}20` : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1, transition: 'all 200ms' } as any}>
                {done && <i className="ri-check-line" style={{ fontSize: 14, color: clr }} />}
              </div>
              <span style={{ fontSize: 13, color: done ? '#FFF' : 'rgba(255,255,255,0.55)', lineHeight: 1.5, textDecoration: done ? 'none' : 'none' }}>{task}</span>
            </div>
          );
        })}
      </div>

      {/* ═══ CONSEIL NORA ═══ */}
      {tt.tip && (
        <div style={{ padding: '14px 16px', borderRadius: 16, background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)', marginBottom: 12, display: 'flex', alignItems: 'flex-start', gap: 10, ...glass } as any}>
          <div style={{ width: 24, height: 24, borderRadius: 8, background: 'rgba(167,139,250,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 } as any}>
            <span style={{ fontSize: 9, fontWeight: 900, color: '#A78BFA' }}>N</span>
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{tt.tip}</div>
        </div>
      )}

      {/* ═══ CHECK-IN ═══ */}
      {!checkedIn ? (
        <div style={{ padding: '18px', borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 12, ...glass } as any}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#FFF', marginBottom: 12 }}>Comment s'est passee votre journee ?</div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 14 } as any}>
            {MOOD_EMOJIS.map(m => (
              <div key={m.val} data-testid={`mood-${m.val}`} onClick={() => setMood(m.val)}
                style={{ width: 48, height: 48, borderRadius: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: mood === m.val ? `${m.color}15` : 'rgba(255,255,255,0.03)', border: `2px solid ${mood === m.val ? m.color : 'rgba(255,255,255,0.06)'}`, transition: 'all 200ms' } as any}>
                <i className={m.icon} style={{ fontSize: 20, color: mood === m.val ? m.color : 'rgba(255,255,255,0.25)' }} />
              </div>
            ))}
          </div>
          <div data-testid="submit-checkin" onClick={submitCheckin}
            style={{ padding: '14px', borderRadius: 14, textAlign: 'center', cursor: mood > 0 && !submitting ? 'pointer' : 'not-allowed', background: mood > 0 ? `linear-gradient(135deg, ${clr}30, ${clr}15)` : 'rgba(255,255,255,0.03)', border: `1px solid ${mood > 0 ? clr + '35' : 'rgba(255,255,255,0.06)'}`, fontSize: 14, fontWeight: 800, color: mood > 0 ? '#FFF' : 'rgba(255,255,255,0.2)', transition: 'all 200ms' } as any}>
            {submitting ? 'Envoi...' : 'Valider mon check-in'}
          </div>
        </div>
      ) : (
        <div style={{ padding: '14px 16px', borderRadius: 16, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, ...glass } as any}>
          <i className="ri-checkbox-circle-fill" style={{ fontSize: 18, color: '#10B981' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#10B981' }}>Check-in valide pour aujourd'hui</span>
        </div>
      )}

      {/* ═══ ARRETER ═══ */}
      {!showStop ? (
        <div onClick={() => setShowStop(true)} style={{ textAlign: 'center', padding: '8px', fontSize: 11, color: 'rgba(239,68,68,0.3)', cursor: 'pointer' } as any}>Arreter le programme</div>
      ) : (
        <div style={{ padding: '16px', borderRadius: 16, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', ...glass } as any}>
          <div style={{ fontSize: 13, fontWeight: 800, color: '#EF4444', marginBottom: 6 }}>Arreter le programme ?</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>Votre progression sera conservee.</div>
          <div style={{ display: 'flex', gap: 8 } as any}>
            <div onClick={() => setShowStop(false)} style={{ flex: 1, padding: '10px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', textAlign: 'center', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#FFF', ...glass } as any}>Annuler</div>
            <div onClick={stopProgram} style={{ flex: 1, padding: '10px', borderRadius: 12, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', textAlign: 'center', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#EF4444' } as any}>Arreter</div>
          </div>
        </div>
      )}
    </div>
  );
}
