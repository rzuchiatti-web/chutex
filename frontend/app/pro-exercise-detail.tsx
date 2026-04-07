import React, { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch, clearApiCache } from '../src/services/api';
import { StatEditor, WeightChart } from '../src/components/exercises/WeightChart';
import { WorkoutPopup } from '../src/components/exercises/WorkoutPopup';

const BG = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/mhh7xwy3_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_08_43.png';
const DIFF_COLORS: Record<string, string> = { facile: '#10B981', moyen: '#F59E0B', difficile: '#EF4444' };
const DIFF_LABELS: Record<string, string> = { facile: 'Facile', moyen: 'Moyen', difficile: 'Difficile' };
const INP: any = { width: '100%', padding: '12px 14px', borderRadius: 12, background: '#F4F4F5', border: '1px solid #E5E7EB', color: '#111', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };

export default function ProExerciseDetailPage() {
  const { token } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const exerciseId = Array.isArray(params.id) ? params.id[0] : params.id;
  const mode = (Array.isArray(params.mode) ? params.mode[0] : params.mode) || 'template';
  const programId = Array.isArray(params.programId) ? params.programId[0] : params.programId;
  const sessionId = Array.isArray(params.sessionId) ? params.sessionId[0] : params.sessionId;
  const assignmentId = (Array.isArray(params.assignmentId) ? params.assignmentId[0] : params.assignmentId) || exerciseId;

  // Dark mode detection
  const [isDark, setIsDark] = useState(() => typeof localStorage !== 'undefined' ? localStorage.getItem('chutex_dark') === '1' : false);
  useEffect(() => {
    if (typeof localStorage === 'undefined') return;
    const iv = setInterval(() => { const v = localStorage.getItem('chutex_dark') === '1'; setIsDark(p => p !== v ? v : p); }, 400);
    return () => clearInterval(iv);
  }, []);

  // Theme colors
  const BG = isDark ? '#0A0A0F' : '#F5F5F5';
  const CARD = isDark ? '#1A1A22' : '#FFF';
  const CARD2 = isDark ? '#22222A' : '#F4F4F5';
  const T = isDark ? '#FFF' : '#111';
  const T2 = isDark ? 'rgba(255,255,255,0.5)' : '#6B7280';
  const T3 = isDark ? 'rgba(255,255,255,0.3)' : '#9CA3AF';
  const BORDER = isDark ? 'rgba(255,255,255,0.08)' : '#E5E7EB';
  const INP_BG = isDark ? 'rgba(255,255,255,0.06)' : '#F4F4F5';
  const INP_BORDER = isDark ? 'rgba(255,255,255,0.1)' : '#E5E7EB';
  const BTN_BG = isDark ? '#FFF' : '#111';
  const BTN_TEXT = isDark ? '#111' : '#FFF';

  const [ex, setEx] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [painLevel, setPainLevel] = useState(0);
  const [notes, setNotes] = useState('');

  // Editable params
  const [editing, setEditing] = useState(false);
  const [editSets, setEditSets] = useState(0);
  const [editReps, setEditReps] = useState(0);
  const [editRest, setEditRest] = useState(0);
  const [savingParams, setSavingParams] = useState(false);

  // Weight
  const [editingWeight, setEditingWeight] = useState(false);
  const [weightKg, setWeightKg] = useState('');
  const [lastWeightKg, setLastWeightKg] = useState<number | null>(null);
  const [savingWeight, setSavingWeight] = useState(false);
  const [weightSaved, setWeightSaved] = useState(false);

  // Workout timer
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [workoutDone, setWorkoutDone] = useState(false);
  const [currentSet, setCurrentSet] = useState(1);
  const [resting, setResting] = useState(false);
  const [restTime, setRestTime] = useState(0);
  const restRef = useRef<any>(null);

  // Create-self form
  const [createForm, setCreateForm] = useState({ title: '', description: '', category: 'force', sets: 3, repetitions: 12, rest_seconds: 60, equipment: '', muscle_group: '' });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    if (mode === 'template' && exerciseId) {
      apiFetch('/api/pro/exercise-templates', {}, token)
        .then(tpls => { const f = (tpls || []).find((t: any) => t.id === exerciseId); setEx(f || null); if (f) initParams(f); })
        .catch(() => {}).finally(() => setLoading(false));
    } else if (mode === 'assigned' && assignmentId) {
      apiFetch(`/api/pro/assigned-exercise-detail/${assignmentId}`, {}, token)
        .then((f: any) => {
          if (f) { setEx(f); initParams(f); const today = new Date().toISOString().split('T')[0]; if (f.completions?.some((c: any) => c.date?.startsWith(today) && c.status === 'done')) setCompleted(true); if (f.last_weight_kg != null) { setLastWeightKg(f.last_weight_kg); setWeightKg(String(f.last_weight_kg)); } }
        }).catch(() => {}).finally(() => setLoading(false));
    } else if (mode === 'session' && programId && sessionId) {
      apiFetch(`/api/pro/programs/detail/${programId}`, {}, token)
        .then(prog => { const s = (prog?.sessions || []).find((s: any) => s.id === sessionId); setEx(s || null); if (s) initParams(s); if (s?.completions?.length > 0 && s.completions[s.completions.length - 1].status === 'done') setCompleted(true); })
        .catch(() => apiFetch('/api/pro/my-programs', {}, token).then(progs => { const p = (progs || []).find((p: any) => p.id === programId); if (p) { const s = (p.sessions || []).find((s: any) => s.id === sessionId); setEx(s || null); if (s) initParams(s); } }).catch(() => {}))
        .finally(() => setLoading(false));
    } else if (mode === 'create-self') {
      setLoading(false);
    }
  }, [exerciseId, programId, sessionId, mode, token]);

  const initParams = (d: any) => { setEditSets(d.sets || 0); setEditReps(d.repetitions || d.reps || 0); setEditRest(d.rest_seconds || 0); };

  const handleComplete = async (status: string) => {
    if (completing) return; setCompleting(true);
    try {
      if (mode === 'assigned' && assignmentId) await apiFetch(`/api/pro/exercises/${assignmentId}/complete`, { method: 'POST', body: JSON.stringify({ status, pain_level: painLevel || null, patient_notes: notes }) }, token);
      else if (programId && sessionId) await apiFetch(`/api/pro/sessions/${programId}/${sessionId}/complete`, { method: 'POST', body: JSON.stringify({ status, pain_level: painLevel || null, patient_notes: notes }) }, token);
      if (status === 'done') setCompleted(true);
      clearApiCache();
    } catch {} finally { setCompleting(false); }
  };

  const saveParams = async () => {
    if (!assignmentId || savingParams) return; setSavingParams(true);
    try {
      const u = await apiFetch(`/api/pro/assigned-exercises/${assignmentId}/update-params`, { method: 'PUT', body: JSON.stringify({ sets: editSets, repetitions: editReps, rest_seconds: editRest }) }, token);
      if (u) { setEx(u); setEditing(false); }
    } catch {} finally { setSavingParams(false); }
  };

  const saveWeight = async () => {
    if (!assignmentId || savingWeight || !weightKg) return; setSavingWeight(true);
    try {
      const r = await apiFetch(`/api/pro/assigned-exercises/${assignmentId}/save-weight`, { method: 'PUT', body: JSON.stringify({ weight_kg: parseFloat(weightKg) }) }, token);
      if (r?.last_weight_kg != null) {
        setLastWeightKg(r.last_weight_kg);
        setWeightSaved(true);
        setEditingWeight(false);
        setTimeout(() => setWeightSaved(false), 2000);
        // Re-fetch exercise to get updated weight_history for graph
        const updated = await apiFetch(`/api/pro/assigned-exercise-detail/${assignmentId}`, {}, token);
        if (updated) setEx(updated);
      }
    } catch {} finally { setSavingWeight(false); }
  };

  const handleCreateExercise = async () => {
    if (creating || !createForm.title.trim()) return; setCreating(true);
    try {
      const lib = await apiFetch('/api/pro/exercise-library', {}, token);
      const tpls = Array.isArray(lib) ? lib : [];
      // Create a self-assigned exercise directly
      const res = await apiFetch('/api/pro/self-assign-exercise', { method: 'POST', body: JSON.stringify({ exercise_template_id: '__custom__', title: createForm.title, sets: createForm.sets, repetitions: createForm.repetitions, rest_seconds: createForm.rest_seconds, days: ['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'] }) }, token);
      if (res) router.back();
    } catch {} finally { setCreating(false); }
  };

  // Sound + vibration alert
  const playAlert = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const playBeep = (freq: number, delay: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = freq; osc.type = 'sine';
        gain.gain.setValueAtTime(0.3, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.3);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.3);
      };
      playBeep(880, 0); playBeep(1100, 0.15); playBeep(1320, 0.3);
    } catch {}
    try { if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 300]); } catch {}
  };

  // Timer logic
  const startRest = () => {
    const restSec = ex?.rest_seconds || editRest || 60;
    setResting(true); setRestTime(restSec);
    restRef.current = setInterval(() => {
      setRestTime(prev => {
        if (prev <= 1) { clearInterval(restRef.current); setResting(false); setCurrentSet(s => s + 1); playAlert(); return 0; }
        if (prev === 4) { try { const ctx = new (window.AudioContext || (window as any).webkitAudioContext)(); const o = ctx.createOscillator(); const g = ctx.createGain(); o.connect(g); g.connect(ctx.destination); o.frequency.value = 440; o.type = 'sine'; g.gain.setValueAtTime(0.15, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15); o.start(); o.stop(ctx.currentTime + 0.15); } catch {} }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => { return () => { if (restRef.current) clearInterval(restRef.current); }; }, []);

  if (Platform.OS !== 'web') return null;

  const accent = DIFF_COLORS[ex?.difficulty] || '#3B82F6';
  const steps = ex?.steps || [];
  const videoSrc = ex?.video_url || ex?.media_url || '';
  const isAssigned = mode === 'assigned';
  const hasWeight = ex?.equipment && ex.equipment !== 'Aucun';
  const totalSets = ex?.sets || editSets || 3;

  // ── CREATE-SELF MODE ──
  if (mode === 'create-self') {
    const cInp: any = { width: '100%', padding: '12px 14px', borderRadius: 12, background: INP_BG, border: `1px solid ${INP_BORDER}`, color: T, fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };
    return (
      <div data-testid="create-exercise-page" style={{ position: 'absolute', inset: 0, background: CARD, fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden', display: 'flex', flexDirection: 'column' } as any}>
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '0 16px 120px' } as any}>
          <div style={{ padding: '20px 0 12px', display: 'flex', alignItems: 'center', gap: 12 } as any}>
            <div data-testid="create-back-btn" onClick={() => router.back()} style={{ width: 40, height: 40, borderRadius: 999, background: CARD2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-left-line" style={{ fontSize: 18, color: T }} /></div>
            <div style={{ fontSize: 20, fontWeight: 900, color: T }}>Creer un exercice</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 } as any}>
            <div><div style={{ fontSize: 12, fontWeight: 700, color: T2, marginBottom: 6 }}>Nom de l'exercice *</div><input data-testid="create-title" value={createForm.title} onChange={(e: any) => setCreateForm(p => ({ ...p, title: e.target.value }))} placeholder="Ex: Developpe couche" style={cInp} /></div>
            <div><div style={{ fontSize: 12, fontWeight: 700, color: T2, marginBottom: 6 }}>Description</div><input value={createForm.description} onChange={(e: any) => setCreateForm(p => ({ ...p, description: e.target.value }))} placeholder="Description de l'exercice" style={cInp} /></div>
            <div><div style={{ fontSize: 12, fontWeight: 700, color: T2, marginBottom: 6 }}>Groupe musculaire</div><input value={createForm.muscle_group} onChange={(e: any) => setCreateForm(p => ({ ...p, muscle_group: e.target.value }))} placeholder="Ex: Pectoraux, Triceps" style={cInp} /></div>
            <div><div style={{ fontSize: 12, fontWeight: 700, color: T2, marginBottom: 6 }}>Equipement</div><input value={createForm.equipment} onChange={(e: any) => setCreateForm(p => ({ ...p, equipment: e.target.value }))} placeholder="Ex: Barre, Halteres" style={cInp} /></div>
            <div style={{ display: 'flex', gap: 10 } as any}>
              <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 700, color: T2, marginBottom: 6 }}>Series</div><input type="number" value={createForm.sets} onChange={(e: any) => setCreateForm(p => ({ ...p, sets: parseInt(e.target.value) || 0 }))} style={cInp} /></div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 700, color: T2, marginBottom: 6 }}>Reps</div><input type="number" value={createForm.repetitions} onChange={(e: any) => setCreateForm(p => ({ ...p, repetitions: parseInt(e.target.value) || 0 }))} style={cInp} /></div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 700, color: T2, marginBottom: 6 }}>Repos (s)</div><input type="number" value={createForm.rest_seconds} onChange={(e: any) => setCreateForm(p => ({ ...p, rest_seconds: parseInt(e.target.value) || 0 }))} style={cInp} /></div>
            </div>
          </div>
          <div data-testid="create-submit-btn" onClick={handleCreateExercise} style={{ marginTop: 24, padding: '16px', borderRadius: 999, background: BTN_BG, textAlign: 'center', cursor: 'pointer', fontSize: 15, fontWeight: 800, color: BTN_TEXT, opacity: creating ? 0.5 : 1 } as any}>{creating ? 'Creation...' : 'Creer et ajouter'}</div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="pro-exercise-detail-page" style={{ position: 'absolute', inset: 0, background: BG, fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden', display: 'flex', flexDirection: 'column' } as any}>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes pulse-ring{0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,0.3)}50%{box-shadow:0 0 0 8px rgba(16,185,129,0)}}` }} />
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>

        {/* HEADER — title + pills, enlarged with 70px top */}
        <div style={{ position: 'relative', zIndex: 1, minHeight: 240 } as any}>
          {(() => {
            const imgSrc = ex?.image ? (ex.image.startsWith('/') ? ex.image : ex.image) : '';
            return <img key={imgSrc || 'bg'} src={imgSrc || BG} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' } as any} />;
          })()}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.65) 100%)' } as any} />
          <div style={{ position: 'relative', zIndex: 2, padding: '70px 16px 28px', maxWidth: 480, margin: '0 auto', width: '100%', boxSizing: 'border-box' } as any}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 } as any}>
              <div data-testid="pro-exercise-back-btn" onClick={() => router.back()} style={{ width: 44, height: 44, borderRadius: 999, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.15)', flexShrink: 0 } as any}>
                <i className="ri-arrow-left-line" style={{ fontSize: 18, color: '#FFF' }} />
              </div>
              {!loading && ex && (
                <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', textTransform: 'capitalize', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>{ex.title}</div>
              )}
            </div>
            {/* Pills — glass blur in header */}
            {!loading && ex && (ex.difficulty || ex.muscle_group) && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 } as any}>
                {ex.difficulty && <span style={{ padding: '6px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)', fontSize: 11, fontWeight: 700, color: '#FFF' }}>{DIFF_LABELS[ex.difficulty] || ex.difficulty}</span>}
                {ex.muscle_group && <span style={{ padding: '6px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)', fontSize: 11, fontWeight: 700, color: '#FFF' }}>{ex.muscle_group}</span>}
                {ex.equipment && ex.equipment !== 'Aucun' && <span style={{ padding: '6px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)', fontSize: 11, fontWeight: 700, color: '#FFF' }}>{ex.equipment}</span>}
              </div>
            )}
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ padding: '20px 16px 120px', marginTop: -16, borderRadius: '24px 24px 0 0', background: CARD, position: 'relative', zIndex: 10, maxWidth: 480, margin: '-16px auto 0', width: '100%', boxSizing: 'border-box', minHeight: 'calc(100vh - 160px)' } as any}>
          {loading && <div style={{ textAlign: 'center', padding: '60px 0', color: T3 }}><i className="ri-loader-4-line" style={{ fontSize: 28, animation: 'spin 0.8s linear infinite', display: 'block', marginBottom: 8 }} />Chargement...</div>}

          {!loading && ex && (
            <>
              {/* STATS with edit button */}
              <div data-testid="exercise-stats" style={{ borderRadius: 16, background: CARD2, marginBottom: 14, overflow: 'hidden' } as any}>
                {editing ? (
                  <>
                    <div style={{ display: 'flex' } as any}>
                      <StatEditor label="Series" value={editSets} onChange={setEditSets} min={1} max={20} accent={accent} />
                      <StatEditor label="Reps" value={editReps} onChange={setEditReps} min={1} max={100} accent={accent} />
                      <StatEditor label="Repos" value={editRest} onChange={setEditRest} min={0} max={300} step={5} suffix="s" accent={accent} />
                    </div>
                    <div style={{ display: 'flex', gap: 8, padding: '10px 12px', borderTop: '1px solid #E5E7EB' } as any}>
                      <div onClick={() => { setEditing(false); initParams(ex); }} style={{ flex: 1, padding: '10px', borderRadius: 10, background: '#E5E7EB', textAlign: 'center', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#6B7280' } as any}>Annuler</div>
                      <div data-testid="save-params-btn" onClick={saveParams} style={{ flex: 1, padding: '10px', borderRadius: 10, background: accent, textAlign: 'center', cursor: 'pointer', fontSize: 12, fontWeight: 800, color: '#FFF', opacity: savingParams ? 0.5 : 1 } as any}>{savingParams ? '...' : 'Enregistrer'}</div>
                    </div>
                  </>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center' } as any}>
                    <div style={{ flex: 1, display: 'flex' } as any}>
                      {ex.sets > 0 && <div style={{ flex: 1, padding: '14px 6px', textAlign: 'center', borderRight: '1px solid #E5E7EB' } as any}><div style={{ fontSize: 22, fontWeight: 900, color: '#111' }}>{ex.sets}</div><div style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginTop: 2 }}>Series</div></div>}
                      {(ex.repetitions > 0 || ex.reps > 0) && <div style={{ flex: 1, padding: '14px 6px', textAlign: 'center', borderRight: '1px solid #E5E7EB' } as any}><div style={{ fontSize: 22, fontWeight: 900, color: '#111' }}>{ex.repetitions || ex.reps}</div><div style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginTop: 2 }}>Reps</div></div>}
                      {(ex.rest_seconds > 0) && <div style={{ flex: 1, padding: '14px 6px', textAlign: 'center' } as any}><div style={{ fontSize: 22, fontWeight: 900, color: '#111' }}>{ex.rest_seconds}<span style={{ fontSize: 10, color: '#9CA3AF' }}>s</span></div><div style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginTop: 2 }}>Repos</div></div>}
                    </div>
                    {isAssigned && <div data-testid="edit-params-btn" onClick={() => { setEditing(true); initParams(ex); }} style={{ padding: '10px 14px', cursor: 'pointer', borderLeft: '1px solid #E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><i className="ri-edit-line" style={{ fontSize: 16, color: '#9CA3AF' }} /></div>}
                  </div>
                )}
              </div>

              {/* WEIGHT — behind edit button */}
              {isAssigned && hasWeight && (
                <div data-testid="weight-tracker" style={{ borderRadius: 16, background: CARD2, padding: '14px 16px', marginBottom: 14 } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: editingWeight ? 10 : 0 } as any}>
                    <div style={{ flex: 1 } as any}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 }}>Poids utilise</div>
                      {lastWeightKg != null ? (
                        <div style={{ fontSize: 28, fontWeight: 900, color: '#111', lineHeight: 1.2, marginTop: 2 }}>{lastWeightKg}<span style={{ fontSize: 14, fontWeight: 700, color: '#9CA3AF', marginLeft: 2 }}>kg</span></div>
                      ) : (
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#D1D5DB', marginTop: 2 }}>Non defini</div>
                      )}
                    </div>
                    {weightSaved && <span style={{ fontSize: 11, fontWeight: 700, color: '#10B981' }}>Enregistre !</span>}
                    <div data-testid="edit-weight-btn" onClick={() => setEditingWeight(!editingWeight)} style={{ width: 36, height: 36, borderRadius: 10, background: editingWeight ? accent : '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
                      <i className={editingWeight ? 'ri-close-line' : 'ri-edit-line'} style={{ fontSize: 14, color: editingWeight ? '#FFF' : '#9CA3AF' }} />
                    </div>
                  </div>
                  {editingWeight && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' } as any}>
                      <div style={{ position: 'relative', flex: 1 } as any}>
                        <input data-testid="weight-input" type="number" value={weightKg} onChange={(e: any) => setWeightKg(e.target.value)} placeholder={lastWeightKg ? `${lastWeightKg}` : 'Ex: 40'} style={{ ...INP, paddingRight: 36 } as any} min="0" step="0.5" />
                        <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, fontWeight: 700, color: '#9CA3AF' }}>kg</span>
                      </div>
                      <div data-testid="save-weight-btn" onClick={saveWeight} style={{ padding: '12px 18px', borderRadius: 12, cursor: 'pointer', fontSize: 12, fontWeight: 800, background: '#111', color: '#FFF', opacity: savingWeight ? 0.5 : 1 } as any}>{savingWeight ? '...' : 'OK'}</div>
                    </div>
                  )}
                  {/* Weight chart — full width */}
                  {ex.weight_history && ex.weight_history.length > 1 && (
                    <WeightChart data={ex.weight_history} accent={accent} />
                  )}
                </div>
              )}

              {/* Description */}
              {ex.description && (
                <div style={{ borderRadius: 16, background: CARD2, padding: '14px 16px', marginBottom: 14 } as any}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T3, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Description</div>
                  <div style={{ fontSize: 13, color: T2, lineHeight: 1.7 }}>{ex.description}</div>
                </div>
              )}

              {/* Video */}
              {videoSrc && (
                <div style={{ borderRadius: 16, background: CARD2, padding: '14px 16px', marginBottom: 14, overflow: 'hidden' } as any}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T3, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Video</div>
                  {videoSrc.includes('youtube') || videoSrc.includes('youtu.be') ? (
                    <div style={{ borderRadius: 12, overflow: 'hidden', aspectRatio: '16/9' } as any}><iframe src={videoSrc.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')} style={{ width: '100%', height: '100%', border: 'none' } as any} allowFullScreen /></div>
                  ) : (
                    <video src={videoSrc} controls style={{ width: '100%', borderRadius: 12, maxHeight: 240 } as any} />
                  )}
                </div>
              )}

              {/* Steps */}
              {steps.length > 0 && steps.some((s: string) => s.trim()) && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: T, marginBottom: 10 }}>Etapes <span style={{ fontSize: 11, fontWeight: 600, color: T3, background: CARD2, padding: '2px 8px', borderRadius: 999, marginLeft: 6 }}>{steps.filter((s: string) => s.trim()).length}</span></div>
                  {steps.filter((s: string) => s.trim()).map((step: string, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 12px', borderRadius: 12, background: CARD2, marginBottom: 4 } as any}>
                      <span style={{ fontSize: 15, fontWeight: 900, color: accent, flexShrink: 0, minWidth: 20 }}>{i + 1}.</span>
                      <div style={{ fontSize: 12, color: T2, lineHeight: 1.6, flex: 1 }}>{step}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* WORKOUT BUTTON — only if workout not done */}
              {isAssigned && !completed && !workoutStarted && !workoutDone && (
                <div data-testid="start-workout-btn" onClick={() => { setWorkoutStarted(true); setCurrentSet(1); setResting(false); }} style={{ padding: '16px', borderRadius: 999, background: BTN_BG, textAlign: 'center', cursor: 'pointer', fontSize: 15, fontWeight: 800, color: BTN_TEXT, marginBottom: 14, transition: 'transform 0.12s' } as any}
                  onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
                  <i className="ri-play-fill" style={{ marginRight: 8 }} />Commencer l'exercice
                </div>
              )}

              {/* Validation — only show green checkmark if already completed */}
              {(mode === 'session' || mode === 'assigned') && (assignmentId || (programId && sessionId)) && completed && (
                <div style={{ borderRadius: 16, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', padding: 16, marginBottom: 14 } as any}>
                    <div data-testid="exercise-completed" style={{ textAlign: 'center', padding: '12px 0' } as any}>
                      <i className="ri-checkbox-circle-fill" style={{ fontSize: 36, color: '#10B981', display: 'block', marginBottom: 8 }} />
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#10B981' }}>Exercice valide !</div>
                    </div>
                </div>
              )}
            </>
          )}
          {!loading && !ex && mode !== 'create-self' && <div style={{ textAlign: 'center', padding: '80px 0', color: T3 } as any}><i className="ri-error-warning-line" style={{ fontSize: 32, display: 'block', marginBottom: 8 }} /><div style={{ fontSize: 14, fontWeight: 600 }}>Exercice non trouve</div></div>}
        </div>
      </div>

      {/* ── FULL-SCREEN WORKOUT POPUP ── */}
      {workoutStarted && ex && (
        <WorkoutPopup
          ex={ex}
          totalSets={totalSets}
          currentSet={currentSet}
          setCurrentSet={setCurrentSet}
          resting={resting}
          setResting={setResting}
          restTime={restTime}
          setRestTime={setRestTime}
          restRef={restRef}
          accent={accent}
          isDark={isDark}
          painLevel={painLevel}
          setPainLevel={setPainLevel}
          notes={notes}
          setNotes={setNotes}
          completing={completing}
          handleComplete={handleComplete}
          onClose={() => { setWorkoutStarted(false); clearInterval(restRef.current); if (currentSet > totalSets) setWorkoutDone(true); }}
          startRest={() => {
            const restSec = ex?.rest_seconds || editRest || 60;
            setResting(true); setRestTime(restSec);
            restRef.current = setInterval(() => {
              setRestTime(prev => { if (prev <= 1) { clearInterval(restRef.current); setResting(false); setCurrentSet(s => s + 1); return 0; } return prev - 1; });
            }, 1000);
          }}
        />
      )}
    </div>
  );
}

/* ── StatEditor, WeightChart, WorkoutPopup — extracted to src/components/exercises/ ── */
