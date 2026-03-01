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

interface Props {
  token: string;
  onStop: () => void;
}

export default function ProgramDailyView({ token, onStop }: Props) {
  const [data, setData] = useState<any>(null);
  const [simDay, setSimDay] = useState(0);
  const [tasksDone, setTasksDone] = useState<string[]>([]);
  const [mood, setMood] = useState(0);
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checkinFeedback, setCheckinFeedback] = useState('');
  const [aiFeedback, setAiFeedback] = useState<any>(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [showBilan, setShowBilan] = useState(false);
  const [bilanData, setBilanData] = useState<any>(null);
  const [bilanLoading, setBilanLoading] = useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);
  const [badges, setBadges] = useState<any[]>([]);
  const [showCheckinDone, setShowCheckinDone] = useState(false);

  const fetchActive = useCallback(async () => {
    const dayParam = simDay > 0 ? `?day=${simDay}` : '';
    const res = await apiFetch(`/api/programs/active${dayParam}`, {}, token).catch(() => null);
    if (res) setData(res);
    if (res?.today_checkin) {
      setShowCheckinDone(true);
      setTasksDone(res.today_checkin.tasks_done || []);
    } else {
      setShowCheckinDone(false);
      setTasksDone([]);
    }
  }, [token, simDay]);

  const fetchFeedback = useCallback(async () => {
    setLoadingFeedback(true);
    const res = await apiFetch('/api/programs/daily-feedback', {}, token).catch(() => null);
    if (res?.has_feedback) setAiFeedback(res.feedback);
    setLoadingFeedback(false);
  }, [token]);

  const fetchBadges = useCallback(async () => {
    const res = await apiFetch('/api/programs/badges', {}, token).catch(() => null);
    if (res?.badges) setBadges(res.badges);
  }, [token]);

  useEffect(() => { fetchActive(); }, [fetchActive]);
  useEffect(() => { fetchFeedback(); fetchBadges(); }, [fetchFeedback, fetchBadges]);

  const toggleTask = (task: string) => {
    if (showCheckinDone) return;
    setTasksDone(prev => prev.includes(task) ? prev.filter(t => t !== task) : [...prev, task]);
  };

  const submitCheckin = async () => {
    if (mood === 0) return;
    setSubmitting(true);
    try {
      const res = await apiFetch('/api/programs/checkin', {
        method: 'POST',
        body: JSON.stringify({ mood, note, tasks_done: tasksDone }),
      }, token);
      setCheckinFeedback(res.feedback || 'Bravo !');
      setShowCheckinDone(true);
      fetchBadges();
    } catch (e: any) {
      setCheckinFeedback('Erreur lors du check-in');
    }
    setSubmitting(false);
  };

  const loadBilan = async (type: 'weekly' | 'completion') => {
    setBilanLoading(true);
    setShowBilan(true);
    try {
      if (type === 'weekly') {
        const res = await apiFetch('/api/programs/weekly-report', {}, token);
        setBilanData({ type: 'weekly', ...res });
      } else {
        const res = await apiFetch(`/api/programs/completion-report/${data?.enrollment_id}`, {}, token);
        setBilanData({ type: 'completion', ...res });
      }
    } catch { setBilanData(null); }
    setBilanLoading(false);
  };

  const stopProgram = async () => {
    await apiFetch('/api/programs/stop', { method: 'POST' }, token).catch(() => {});
    onStop();
  };

  if (!data?.active) return null;
  if (Platform.OS !== 'web') return null;

  const pg = data.program;
  const tt = data.today_tasks || {};
  const phase = data.current_phase;
  const cd = data.current_day;
  const dur = pg?.duration_days || 21;
  const clr = pg?.color || '#A78BFA';
  const isBilanDay = cd === 7 || cd === 14 || cd === dur;
  const allTasksDone = tt.tasks && tasksDone.length === tt.tasks.length;
  const unlockedBadges = badges.filter((b: any) => b.unlocked);

  // Phase dots
  const phases = pg?.phases || [];
  const phaseMarkers = phases.map((p: any) => ({
    ...p,
    startPct: ((p.days[0] - 1) / dur) * 100,
    endPct: (p.days[1] / dur) * 100,
  }));

  return (
    <div data-testid="program-daily-view" style={{ marginBottom: 14 } as any}>
      {/* ── HEADER ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 } as any}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 } as any}>
          <div style={{ width: 44, height: 44, borderRadius: 14, background: `${clr}15`, border: `1px solid ${clr}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
            <i className={pg.icon} style={{ fontSize: 22, color: clr }} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 900, color: '#FFF', letterSpacing: -0.3 }}>{pg.title}</div>
            <div style={{ fontSize: 11, color: clr, fontWeight: 700 }}>{phase?.name || `Phase ${Math.ceil(cd / 7)}`} · Jour {cd}/{dur}</div>
          </div>
        </div>
        {/* Day nav */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 3 } as any}>
          <div onClick={() => setSimDay(Math.max(1, (simDay || cd) - 1))} style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
            <i className="ri-arrow-left-s-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }} />
          </div>
          <div style={{ padding: '5px 14px', borderRadius: 10, background: `${clr}20`, border: `1px solid ${clr}35`, fontSize: 15, fontWeight: 900, color: clr, minWidth: 50, textAlign: 'center' } as any}>J{cd}</div>
          <div onClick={() => setSimDay(Math.min(dur, (simDay || cd) + 1))} style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
            <i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }} />
          </div>
        </div>
      </div>

      {/* ── PROGRESS BAR WITH PHASES ── */}
      <div style={{ position: 'relative', marginBottom: 16 } as any}>
        <div style={{ height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' } as any}>
          <div style={{ height: 8, borderRadius: 4, width: `${data.progress_pct}%`, background: `linear-gradient(90deg, ${clr}60, ${clr})`, transition: 'width 0.5s ease' } as any} />
        </div>
        {/* Phase markers */}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 } as any}>
          {phases.map((p: any, i: number) => (
            <div key={i} style={{ fontSize: 9, color: cd >= p.days[0] && cd <= p.days[1] ? clr : 'rgba(255,255,255,0.2)', fontWeight: cd >= p.days[0] && cd <= p.days[1] ? 700 : 400 }}>
              {p.name}
            </div>
          ))}
        </div>
      </div>

      {/* ── STREAK & BADGES ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 } as any}>
        <div style={{ flex: 1, padding: '10px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 } as any}>
          <i className="ri-fire-fill" style={{ fontSize: 22, color: data.streak >= 3 ? '#F59E0B' : 'rgba(255,255,255,0.15)' }} />
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF' }}>{data.streak}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>jours d'affilee</div>
          </div>
        </div>
        <div style={{ flex: 1, padding: '10px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 10 } as any}>
          <i className="ri-trophy-line" style={{ fontSize: 22, color: unlockedBadges.length > 0 ? '#22D3EE' : 'rgba(255,255,255,0.15)' }} />
          <div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF' }}>{unlockedBadges.length}</div>
            <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>badges gagnes</div>
          </div>
        </div>
      </div>

      {/* ── TEAM PROGRESS (if in team) ── */}
      {data.team && data.team.members && data.team.members.length > 1 && (
        <div data-testid="team-progress" style={{ padding: '14px 18px', borderRadius: 18, background: 'rgba(167,139,250,0.04)', border: '1px solid rgba(167,139,250,0.12)', marginBottom: 14 } as any}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 } as any}>
            <i className="ri-team-line" style={{ fontSize: 16, color: '#A78BFA' }} />
            <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(167,139,250,0.6)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Equipe · {data.team.members.length} membres</span>
            <span style={{ marginLeft: 'auto', fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>Code: {data.team.invite_code}</span>
          </div>
          {data.team.members.map((m: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' } as any}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: m.checked_in_today ? 'rgba(16,185,129,0.15)' : m.is_me ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.06)', border: `1px solid ${m.checked_in_today ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                {m.checked_in_today ? <i className="ri-check-line" style={{ fontSize: 16, color: '#10B981' }} /> : <span style={{ fontSize: 12, fontWeight: 700, color: m.is_me ? '#A78BFA' : 'rgba(255,255,255,0.3)' }}>{m.name?.charAt(0)}</span>}
              </div>
              <div style={{ flex: 1 } as any}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{m.name} {m.is_me ? '(vous)' : ''}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>
                  {m.checked_in_today ? `${m.tasks_done_today} tache${m.tasks_done_today > 1 ? 's' : ''} validee${m.tasks_done_today > 1 ? 's' : ''}` : 'Pas encore valide'}
                  {m.mood_today ? ` · Humeur ${m.mood_today}/5` : ''}
                </div>
              </div>
              {m.checked_in_today && <i className="ri-checkbox-circle-fill" style={{ fontSize: 18, color: '#10B981' }} />}
            </div>
          ))}
        </div>
      )}

      {/* ── BILAN DAY BANNER ── */}
      {isBilanDay && (
        <div onClick={() => loadBilan(cd === dur ? 'completion' : 'weekly')} data-testid="bilan-banner" style={{ padding: '14px 18px', borderRadius: 16, background: `linear-gradient(135deg, ${clr}18, ${clr}08)`, border: `1px solid ${clr}30`, marginBottom: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 } as any}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: `${clr}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
            <i className={cd === dur ? 'ri-trophy-line' : 'ri-bar-chart-box-line'} style={{ fontSize: 20, color: clr }} />
          </div>
          <div style={{ flex: 1 } as any}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF' }}>{cd === dur ? 'Bilan Final' : `Bilan Semaine ${Math.ceil(cd / 7)}`}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Voir tes resultats et ta progression</div>
          </div>
          <i className="ri-arrow-right-s-line" style={{ fontSize: 20, color: clr }} />
        </div>
      )}

      {/* ── MISSION DU JOUR ── */}
      <div data-testid="daily-mission" style={{ padding: '18px 20px', borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', marginBottom: 14 } as any}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 } as any}>
          <i className="ri-focus-3-line" style={{ fontSize: 16, color: clr }} />
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.8 }}>Mission du jour</div>
        </div>
        <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF', marginBottom: 8, lineHeight: 1.3 }}>{tt.focus}</div>
        {/* Science mission text */}
        {tt.mission && (
          <div style={{ padding: '12px 14px', borderRadius: 14, background: `${clr}06`, border: `1px solid ${clr}12`, marginBottom: 12 } as any}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 } as any}>
              <i className="ri-microscope-line" style={{ fontSize: 12, color: clr }} />
              <span style={{ fontSize: 9, fontWeight: 700, color: clr, textTransform: 'uppercase', letterSpacing: 0.5 }}>Base scientifique</span>
            </div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>{tt.mission}</div>
          </div>
        )}

        {/* Tasks checklist */}
        {tt.tasks && (
          <div style={{ marginTop: 6 } as any}>
            {tt.tasks.map((t: string, i: number) => {
              const done = tasksDone.includes(t);
              return (
                <div key={i} data-testid={`task-${i}`} onClick={() => toggleTask(t)}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none', cursor: showCheckinDone ? 'default' : 'pointer', transition: 'opacity 0.2s' } as any}>
                  <div style={{
                    width: 22, height: 22, borderRadius: 7, flexShrink: 0, marginTop: 1,
                    background: done ? `${clr}20` : 'transparent',
                    border: `2px solid ${done ? clr : 'rgba(255,255,255,0.15)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                  } as any}>
                    {done && <i className="ri-check-line" style={{ fontSize: 14, color: clr }} />}
                  </div>
                  <span style={{ fontSize: 13, color: done ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.45)', lineHeight: 1.5, textDecoration: done ? 'line-through' : 'none', transition: 'all 0.2s' }}>{t}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Tip */}
        {tt.tip && (
          <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 12, background: `${clr}08`, border: `1px solid ${clr}15`, display: 'flex', alignItems: 'flex-start', gap: 8 } as any}>
            <i className="ri-lightbulb-flash-line" style={{ fontSize: 16, color: clr, flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{tt.tip}</span>
          </div>
        )}

        {/* Task progress */}
        {tt.tasks && (
          <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8 } as any}>
            <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' } as any}>
              <div style={{ height: 4, borderRadius: 2, width: `${(tasksDone.length / tt.tasks.length) * 100}%`, background: clr, transition: 'width 0.3s' } as any} />
            </div>
            <span style={{ fontSize: 10, fontWeight: 700, color: allTasksDone ? '#10B981' : 'rgba(255,255,255,0.3)' }}>{tasksDone.length}/{tt.tasks.length}</span>
          </div>
        )}
      </div>

      {/* ── AI FEEDBACK ── */}
      {aiFeedback && (
        <div data-testid="ai-feedback" style={{ padding: '16px 18px', borderRadius: 18, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 14 } as any}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 } as any}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: `${clr}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
              <i className="ri-robot-2-line" style={{ fontSize: 14, color: clr }} />
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase' }}>Coach IA</div>
            {aiFeedback.mood_indicator && (
              <div style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: 4, background: aiFeedback.mood_indicator === 'good' ? '#10B981' : aiFeedback.mood_indicator === 'warning' ? '#F59E0B' : 'rgba(255,255,255,0.2)' } as any} />
            )}
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{aiFeedback.message}</div>
          {aiFeedback.tip && (
            <div style={{ marginTop: 8, fontSize: 12, color: clr, fontWeight: 600 }}>{aiFeedback.tip}</div>
          )}
        </div>
      )}
      {loadingFeedback && !aiFeedback && (
        <div style={{ padding: '14px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', marginBottom: 14, textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.2)' } as any}>
          <i className="ri-loader-4-line" style={{ marginRight: 6 }} />Analyse IA en cours...
        </div>
      )}

      {/* ── CHECK-IN ── */}
      {!showCheckinDone ? (
        <div data-testid="checkin-form" style={{ padding: '18px 20px', borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', marginBottom: 14 } as any}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF', marginBottom: 4 }}>Check-in du jour</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 14 }}>Comment te sens-tu aujourd'hui ?</div>

          {/* Mood selector */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 } as any}>
            {MOOD_EMOJIS.map(m => (
              <div key={m.val} data-testid={`mood-${m.val}`} onClick={() => setMood(m.val)}
                style={{
                  flex: 1, padding: '10px 4px', borderRadius: 14, textAlign: 'center', cursor: 'pointer',
                  background: mood === m.val ? `${m.color}15` : 'rgba(255,255,255,0.02)',
                  border: `2px solid ${mood === m.val ? m.color : 'rgba(255,255,255,0.06)'}`,
                  transition: 'all 0.2s',
                } as any}>
                <i className={m.icon} style={{ fontSize: 24, color: mood === m.val ? m.color : 'rgba(255,255,255,0.2)', display: 'block', marginBottom: 4 }} />
                <div style={{ fontSize: 9, fontWeight: 600, color: mood === m.val ? m.color : 'rgba(255,255,255,0.2)' }}>{m.label}</div>
              </div>
            ))}
          </div>

          {/* Note */}
          <textarea
            value={note}
            onChange={(e: any) => setNote(e.target.value)}
            placeholder="Une note sur ta journee... (optionnel)"
            rows={2}
            style={{
              width: '100%', padding: '12px 14px', borderRadius: 14,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              color: '#FFF', fontSize: 13, fontFamily: 'inherit', resize: 'none',
              boxSizing: 'border-box', outline: 'none',
            } as any}
          />

          {/* Submit */}
          <div data-testid="submit-checkin" onClick={submitCheckin}
            style={{
              marginTop: 12, padding: '14px', borderRadius: 14, textAlign: 'center',
              cursor: mood > 0 && !submitting ? 'pointer' : 'not-allowed',
              background: mood > 0 ? `linear-gradient(135deg, ${clr}30, ${clr}15)` : 'rgba(255,255,255,0.03)',
              border: `1px solid ${mood > 0 ? `${clr}40` : 'rgba(255,255,255,0.06)'}`,
              fontSize: 14, fontWeight: 800,
              color: mood > 0 ? '#FFF' : 'rgba(255,255,255,0.2)',
              transition: 'all 0.2s',
            } as any}>
            {submitting ? 'Envoi...' : 'Valider mon check-in'}
          </div>
        </div>
      ) : (
        <div data-testid="checkin-done" style={{ padding: '16px 18px', borderRadius: 18, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', marginBottom: 14 } as any}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
            <i className="ri-checkbox-circle-fill" style={{ fontSize: 20, color: '#10B981' }} />
            <div style={{ fontSize: 13, fontWeight: 700, color: '#10B981' }}>Check-in du jour valide !</div>
          </div>
          {checkinFeedback && (
            <div style={{ marginTop: 8, fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, fontStyle: 'italic' }}>"{checkinFeedback}"</div>
          )}
        </div>
      )}

      {/* ── SIMULATION INDICATOR ── */}
      {simDay > 0 && (
        <div style={{ textAlign: 'center', padding: '8px', borderRadius: 10, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', marginBottom: 14, fontSize: 11, color: '#F59E0B' } as any}>
          <i className="ri-eye-line" style={{ marginRight: 6 }} />
          Mode simulation · Jour {cd} ·
          <span onClick={() => setSimDay(0)} style={{ cursor: 'pointer', textDecoration: 'underline', marginLeft: 4 }}>Retour au jour reel</span>
        </div>
      )}

      {/* ── ACTIONS ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14 } as any}>
        <div onClick={() => loadBilan('weekly')} data-testid="btn-weekly-report" style={{ flex: 1, padding: '12px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', textAlign: 'center' } as any}>
          <i className="ri-bar-chart-box-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.3)', display: 'block', marginBottom: 4 }} />
          <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.35)' }}>Bilan hebdo</div>
        </div>
        <div onClick={() => setShowStopConfirm(true)} data-testid="btn-stop-program" style={{ flex: 1, padding: '12px', borderRadius: 14, background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.1)', cursor: 'pointer', textAlign: 'center' } as any}>
          <i className="ri-stop-circle-line" style={{ fontSize: 18, color: 'rgba(239,68,68,0.4)', display: 'block', marginBottom: 4 }} />
          <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(239,68,68,0.5)' }}>Arreter</div>
        </div>
      </div>

      {/* ── BADGES ROW ── */}
      {badges.length > 0 && (
        <div style={{ marginBottom: 14 } as any}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', marginBottom: 8 }}>Badges</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' } as any}>
            {badges.map((b: any) => (
              <div key={b.id} style={{
                padding: '8px 14px', borderRadius: 12,
                background: b.unlocked ? `${b.color}12` : 'rgba(255,255,255,0.02)',
                border: `1px solid ${b.unlocked ? `${b.color}25` : 'rgba(255,255,255,0.04)'}`,
                display: 'flex', alignItems: 'center', gap: 6, opacity: b.unlocked ? 1 : 0.35,
              } as any}>
                <i className={b.icon} style={{ fontSize: 14, color: b.unlocked ? b.color : 'rgba(255,255,255,0.2)' }} />
                <span style={{ fontSize: 10, fontWeight: 600, color: b.unlocked ? '#FFF' : 'rgba(255,255,255,0.3)' }}>{b.title}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── STOP CONFIRM MODAL ── */}
      {showStopConfirm && (
        <div onClick={() => setShowStopConfirm(false)} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
          <div onClick={(e: any) => e.stopPropagation()} style={{ width: '90%', maxWidth: 340, padding: '28px', borderRadius: 24, background: '#1a1f2e', border: '1px solid rgba(255,255,255,0.1)' } as any}>
            <div style={{ textAlign: 'center', marginBottom: 20 } as any}>
              <i className="ri-error-warning-line" style={{ fontSize: 40, color: '#EF4444', display: 'block', marginBottom: 12 }} />
              <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF', marginBottom: 6 }}>Arreter le programme ?</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>Ta progression sera perdue. Tu pourras recommencer un nouveau programme.</div>
            </div>
            <div style={{ display: 'flex', gap: 10 } as any}>
              <div onClick={() => setShowStopConfirm(false)} style={{ flex: 1, padding: '14px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', textAlign: 'center', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#FFF' } as any}>Annuler</div>
              <div onClick={stopProgram} style={{ flex: 1, padding: '14px', borderRadius: 14, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', textAlign: 'center', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#EF4444' } as any}>Arreter</div>
            </div>
          </div>
        </div>
      )}

      {/* ── BILAN MODAL ── */}
      {showBilan && (
        <div onClick={() => { setShowBilan(false); setBilanData(null); }} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', overflowY: 'auto' } as any}>
          <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '30px 20px 100px' } as any}>
            {/* Close */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}>
              <div onClick={() => { setShowBilan(false); setBilanData(null); }} style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
                <i className="ri-close-line" style={{ fontSize: 18, color: '#FFF' }} />
              </div>
            </div>

            {bilanLoading && (
              <div style={{ textAlign: 'center', padding: '60px 0' } as any}>
                <i className="ri-loader-4-line" style={{ fontSize: 32, color: clr, display: 'block', marginBottom: 12 }} />
                <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>Generation du bilan IA...</div>
              </div>
            )}

            {bilanData && !bilanLoading && bilanData.type === 'weekly' && (() => {
              const r = bilanData.report || {};
              const s = bilanData.stats || {};
              return (
                <>
                  <div style={{ textAlign: 'center', marginBottom: 24 } as any}>
                    <div style={{ width: 56, height: 56, borderRadius: 16, background: `${clr}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' } as any}>
                      <i className="ri-bar-chart-box-line" style={{ fontSize: 28, color: clr }} />
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', marginBottom: 6 }}>{r.title || 'Bilan hebdomadaire'}</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{r.summary}</div>
                  </div>

                  {/* Stats */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 20 } as any}>
                    {[
                      { val: s.checkins_this_week, label: 'Check-ins', sub: `vs ${s.checkins_last_week} sem. dern.`, color: '#10B981' },
                      { val: s.avg_mood_this_week, label: 'Humeur moy.', sub: s.mood_trend === 'up' ? 'En hausse' : s.mood_trend === 'down' ? 'En baisse' : 'Stable', color: s.mood_trend === 'up' ? '#10B981' : '#F59E0B' },
                    ].map((st, i) => (
                      <div key={i} style={{ flex: 1, padding: '14px', borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' } as any}>
                        <div style={{ fontSize: 28, fontWeight: 900, color: st.color }}>{st.val}</div>
                        <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>{st.label}</div>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>{st.sub}</div>
                      </div>
                    ))}
                  </div>

                  {/* Wins */}
                  {r.wins && (
                    <div style={{ marginBottom: 16 } as any}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#10B981', textTransform: 'uppercase', marginBottom: 8 }}>Victoires</div>
                      {r.wins.map((w: string, i: number) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 } as any}>
                          <i className="ri-checkbox-circle-fill" style={{ fontSize: 14, color: '#10B981' }} />
                          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{w}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Improvements */}
                  {r.improvements && (
                    <div style={{ marginBottom: 16 } as any}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B', textTransform: 'uppercase', marginBottom: 8 }}>A ameliorer</div>
                      {r.improvements.map((w: string, i: number) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 } as any}>
                          <i className="ri-arrow-up-circle-line" style={{ fontSize: 14, color: '#F59E0B' }} />
                          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{w}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Goal */}
                  {r.next_week_goal && (
                    <div style={{ padding: '14px 16px', borderRadius: 14, background: `${clr}08`, border: `1px solid ${clr}15`, marginBottom: 16 } as any}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: clr, textTransform: 'uppercase', marginBottom: 4 }}>Objectif semaine prochaine</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{r.next_week_goal}</div>
                    </div>
                  )}

                  {/* Motivation */}
                  {r.motivation && (
                    <div style={{ textAlign: 'center', fontSize: 15, fontWeight: 700, color: clr, padding: '12px 0' }}>{r.motivation}</div>
                  )}
                </>
              );
            })()}

            {bilanData && !bilanLoading && bilanData.type === 'completion' && (() => {
              const r = bilanData.report || {};
              const s = bilanData.stats || {};
              return (
                <>
                  <div style={{ textAlign: 'center', marginBottom: 24 } as any}>
                    <div style={{ width: 72, height: 72, borderRadius: 22, background: `${clr}15`, border: `2px solid ${clr}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' } as any}>
                      <i className="ri-trophy-fill" style={{ fontSize: 36, color: clr }} />
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', marginBottom: 6 }}>{r.title || 'Programme termine !'}</div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>{r.summary}</div>
                  </div>

                  {/* Stats grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 } as any}>
                    {[
                      { val: `${s.completed_days}/${s.total_days}`, label: 'Jours completes', color: '#10B981' },
                      { val: `${s.completion_pct}%`, label: 'Completion', color: clr },
                      { val: `${s.avg_mood}/5`, label: 'Humeur moyenne', color: '#FCD34D' },
                      { val: s.streak, label: 'Meilleur streak', color: '#F59E0B' },
                    ].map((st, i) => (
                      <div key={i} style={{ padding: '14px', borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' } as any}>
                        <div style={{ fontSize: 24, fontWeight: 900, color: st.color }}>{st.val}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{st.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Before/After */}
                  {r.before_after && (
                    <div style={{ marginBottom: 20 } as any}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: 10 }}>Avant / Apres</div>
                      <div style={{ display: 'flex', gap: 10 } as any}>
                        <div style={{ flex: 1, padding: '14px', borderRadius: 14, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)', textAlign: 'center' } as any}>
                          <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(239,68,68,0.6)', textTransform: 'uppercase', marginBottom: 4 }}>Avant</div>
                          <div style={{ fontSize: 20, fontWeight: 900, color: '#EF4444' }}>{r.before_after.mood?.before || '?'}/5</div>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>humeur</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center' } as any}><i className="ri-arrow-right-line" style={{ fontSize: 20, color: 'rgba(255,255,255,0.15)' }} /></div>
                        <div style={{ flex: 1, padding: '14px', borderRadius: 14, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)', textAlign: 'center' } as any}>
                          <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(16,185,129,0.6)', textTransform: 'uppercase', marginBottom: 4 }}>Apres</div>
                          <div style={{ fontSize: 20, fontWeight: 900, color: '#10B981' }}>{r.before_after.mood?.after || '?'}/5</div>
                          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>humeur</div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Achievements */}
                  {r.achievements && (
                    <div style={{ marginBottom: 16 } as any}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#10B981', textTransform: 'uppercase', marginBottom: 8 }}>Realisations</div>
                      {r.achievements.map((a: string, i: number) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 } as any}>
                          <i className="ri-star-fill" style={{ fontSize: 14, color: '#FCD34D' }} />
                          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{a}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Next Steps */}
                  {r.next_steps && (
                    <div style={{ marginBottom: 16 } as any}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: clr, textTransform: 'uppercase', marginBottom: 8 }}>Prochaines etapes</div>
                      {r.next_steps.map((s: string, i: number) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 } as any}>
                          <i className="ri-arrow-right-circle-line" style={{ fontSize: 14, color: clr }} />
                          <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{s}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Celebration */}
                  {r.celebration && (
                    <div style={{ textAlign: 'center', padding: '16px', borderRadius: 16, background: `${clr}10`, border: `1px solid ${clr}25`, fontSize: 16, fontWeight: 800, color: clr, lineHeight: 1.4 } as any}>
                      {r.celebration}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
