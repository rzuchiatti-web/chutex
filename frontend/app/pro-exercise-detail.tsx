import React, { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';

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
    return (
      <div data-testid="create-exercise-page" style={{ position: 'absolute', inset: 0, background: '#FFF', fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden', display: 'flex', flexDirection: 'column' } as any}>
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '0 16px 120px' } as any}>
          <div style={{ padding: '20px 0 12px', display: 'flex', alignItems: 'center', gap: 12 } as any}>
            <div data-testid="create-back-btn" onClick={() => router.back()} style={{ width: 40, height: 40, borderRadius: 12, background: '#F4F4F5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-left-line" style={{ fontSize: 18, color: '#111' }} /></div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#111' }}>Creer un exercice</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 8 } as any}>
            <div><div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', marginBottom: 6 }}>Nom de l'exercice *</div><input data-testid="create-title" value={createForm.title} onChange={(e: any) => setCreateForm(p => ({ ...p, title: e.target.value }))} placeholder="Ex: Developpe couche" style={INP} /></div>
            <div><div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', marginBottom: 6 }}>Description</div><input value={createForm.description} onChange={(e: any) => setCreateForm(p => ({ ...p, description: e.target.value }))} placeholder="Description de l'exercice" style={INP} /></div>
            <div><div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', marginBottom: 6 }}>Groupe musculaire</div><input value={createForm.muscle_group} onChange={(e: any) => setCreateForm(p => ({ ...p, muscle_group: e.target.value }))} placeholder="Ex: Pectoraux, Triceps" style={INP} /></div>
            <div><div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', marginBottom: 6 }}>Equipement</div><input value={createForm.equipment} onChange={(e: any) => setCreateForm(p => ({ ...p, equipment: e.target.value }))} placeholder="Ex: Barre, Halteres" style={INP} /></div>
            <div style={{ display: 'flex', gap: 10 } as any}>
              <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', marginBottom: 6 }}>Series</div><input type="number" value={createForm.sets} onChange={(e: any) => setCreateForm(p => ({ ...p, sets: parseInt(e.target.value) || 0 }))} style={INP} /></div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', marginBottom: 6 }}>Reps</div><input type="number" value={createForm.repetitions} onChange={(e: any) => setCreateForm(p => ({ ...p, repetitions: parseInt(e.target.value) || 0 }))} style={INP} /></div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 12, fontWeight: 700, color: '#6B7280', marginBottom: 6 }}>Repos (s)</div><input type="number" value={createForm.rest_seconds} onChange={(e: any) => setCreateForm(p => ({ ...p, rest_seconds: parseInt(e.target.value) || 0 }))} style={INP} /></div>
            </div>
          </div>
          <div data-testid="create-submit-btn" onClick={handleCreateExercise} style={{ marginTop: 24, padding: '16px', borderRadius: 16, background: '#111', textAlign: 'center', cursor: 'pointer', fontSize: 15, fontWeight: 800, color: '#FFF', opacity: creating ? 0.5 : 1 } as any}>{creating ? 'Creation...' : 'Creer et ajouter'}</div>
        </div>
      </div>
    );
  }

  return (
    <div data-testid="pro-exercise-detail-page" style={{ position: 'absolute', inset: 0, background: '#F5F5F5', fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden', display: 'flex', flexDirection: 'column' } as any}>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes pulse-ring{0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,0.3)}50%{box-shadow:0 0 0 8px rgba(16,185,129,0)}}` }} />
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>

        {/* HEADER — title only, no icon */}
        <div style={{ position: 'relative', zIndex: 1, minHeight: 160 } as any}>
          {(() => {
            const imgSrc = ex?.image ? (ex.image.startsWith('/') ? ex.image : ex.image) : '';
            return <img key={imgSrc || 'bg'} src={imgSrc || BG} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' } as any} />;
          })()}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.65) 100%)' } as any} />
          <div style={{ position: 'relative', zIndex: 2, padding: '24px 16px 28px', maxWidth: 480, margin: '0 auto', width: '100%', boxSizing: 'border-box' } as any}>
            <div data-testid="pro-exercise-back-btn" onClick={() => router.back()} style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.15)', marginBottom: 12 } as any}>
              <i className="ri-arrow-left-line" style={{ fontSize: 16, color: '#FFF' }} />
            </div>
            {!loading && ex && (
              <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', textTransform: 'capitalize', textShadow: '0 2px 8px rgba(0,0,0,0.3)' }}>{ex.title}</div>
            )}
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ padding: '20px 16px 120px', marginTop: -16, borderRadius: '24px 24px 0 0', background: '#FFF', position: 'relative', zIndex: 10, maxWidth: 480, margin: '-16px auto 0', width: '100%', boxSizing: 'border-box' } as any}>
          {loading && <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}><i className="ri-loader-4-line" style={{ fontSize: 28, animation: 'spin 0.8s linear infinite', display: 'block', marginBottom: 8 }} />Chargement...</div>}

          {!loading && ex && (
            <>
              {/* Info tags */}
              {(ex.difficulty || ex.muscle_group || ex.equipment) && (
                <div data-testid="exercise-info" style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 } as any}>
                  {ex.difficulty && <span style={{ padding: '5px 10px', borderRadius: 8, background: `${accent}10`, fontSize: 11, fontWeight: 700, color: accent }}>{DIFF_LABELS[ex.difficulty] || ex.difficulty}</span>}
                  {ex.muscle_group && <span style={{ padding: '5px 10px', borderRadius: 8, background: '#F4F4F5', fontSize: 11, fontWeight: 700, color: '#6B7280' }}>{ex.muscle_group}</span>}
                  {ex.equipment && ex.equipment !== 'Aucun' && <span style={{ padding: '5px 10px', borderRadius: 8, background: '#F4F4F5', fontSize: 11, fontWeight: 700, color: '#6B7280' }}>{ex.equipment}</span>}
                </div>
              )}

              {/* STATS with edit button */}
              <div data-testid="exercise-stats" style={{ borderRadius: 16, background: '#F4F4F5', marginBottom: 14, overflow: 'hidden' } as any}>
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
                <div data-testid="weight-tracker" style={{ borderRadius: 16, background: '#F4F4F5', padding: '14px 16px', marginBottom: 14 } as any}>
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
                <div style={{ borderRadius: 16, background: '#F4F4F5', padding: '14px 16px', marginBottom: 14 } as any}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Description</div>
                  <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.7 }}>{ex.description}</div>
                </div>
              )}

              {/* Video */}
              {videoSrc && (
                <div style={{ borderRadius: 16, background: '#F4F4F5', padding: '14px 16px', marginBottom: 14, overflow: 'hidden' } as any}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Video</div>
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
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#111', marginBottom: 10 }}>Etapes <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', background: '#E5E7EB', padding: '2px 8px', borderRadius: 999, marginLeft: 6 }}>{steps.filter((s: string) => s.trim()).length}</span></div>
                  {steps.filter((s: string) => s.trim()).map((step: string, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 12px', borderRadius: 12, background: '#F4F4F5', marginBottom: 4 } as any}>
                      <span style={{ fontSize: 15, fontWeight: 900, color: accent, flexShrink: 0, minWidth: 20 }}>{i + 1}.</span>
                      <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.6, flex: 1 }}>{step}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* WORKOUT BUTTON — direct, not in a card */}
              {isAssigned && !completed && !workoutStarted && (
                <div data-testid="start-workout-btn" onClick={() => { setWorkoutStarted(true); setCurrentSet(1); setResting(false); }} style={{ padding: '16px', borderRadius: 14, background: '#111', textAlign: 'center', cursor: 'pointer', fontSize: 15, fontWeight: 800, color: '#FFF', marginBottom: 14, transition: 'transform 0.12s' } as any}
                  onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
                  <i className="ri-play-fill" style={{ marginRight: 8 }} />Commencer l'exercice
                </div>
              )}

              {/* Validation */}
              {(mode === 'session' || mode === 'assigned') && (assignmentId || (programId && sessionId)) && (
                <div style={{ borderRadius: 16, background: completed ? 'rgba(16,185,129,0.06)' : '#F4F4F5', border: completed ? '1px solid rgba(16,185,129,0.2)' : '1px solid transparent', padding: 16, marginBottom: 14 } as any}>
                  {completed ? (
                    <div data-testid="exercise-completed" style={{ textAlign: 'center', padding: '12px 0' } as any}>
                      <i className="ri-checkbox-circle-fill" style={{ fontSize: 36, color: '#10B981', display: 'block', marginBottom: 8 }} />
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#10B981' }}>Exercice valide !</div>
                    </div>
                  ) : (
                    <>
                      <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Validation</div>
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 6, fontWeight: 600 }}>Niveau de douleur</div>
                        <div style={{ display: 'flex', gap: 3 } as any}>
                          {[1,2,3,4,5,6,7,8,9,10].map(n => (
                            <div key={n} onClick={() => setPainLevel(n)} style={{ flex: 1, height: 28, borderRadius: 6, background: n <= painLevel ? (n <= 3 ? '#10B981' : n <= 6 ? '#F59E0B' : '#EF4444') : '#E5E7EB', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: n <= painLevel ? '#FFF' : '#9CA3AF', transition: 'all 0.15s' } as any}>{n}</div>
                          ))}
                        </div>
                      </div>
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 6, fontWeight: 600 }}>Notes</div>
                        <input data-testid="exercise-notes-input" value={notes} onChange={(e: any) => setNotes(e.target.value)} placeholder="Comment ca s'est passe ?" style={INP} />
                      </div>
                      <div data-testid="validate-exercise-btn" onClick={() => handleComplete('done')} style={{ padding: '14px', borderRadius: 14, background: '#111', textAlign: 'center', cursor: 'pointer', fontSize: 14, fontWeight: 800, color: '#FFF', opacity: completing ? 0.5 : 1 } as any}>{completing ? 'Validation...' : 'Valider'}</div>
                    </>
                  )}
                </div>
              )}
            </>
          )}
          {!loading && !ex && mode !== 'create-self' && <div style={{ textAlign: 'center', padding: '80px 0', color: '#9CA3AF' } as any}><i className="ri-error-warning-line" style={{ fontSize: 32, display: 'block', marginBottom: 8 }} /><div style={{ fontSize: 14, fontWeight: 600 }}>Exercice non trouve</div></div>}
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
          onClose={() => { setWorkoutStarted(false); clearInterval(restRef.current); }}
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

/* ── StatEditor ── */
function StatEditor({ label, value, onChange, min = 0, max = 999, step = 1, suffix = '', accent = '#3B82F6' }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; suffix?: string; accent?: string }) {
  return (
    <div data-testid={`stat-editor-${label.toLowerCase()}`} style={{ flex: 1, padding: '10px 4px', textAlign: 'center', borderRight: '1px solid #E5E7EB' } as any}>
      <div style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 } as any}>
        <div onClick={() => onChange(Math.max(min, value - step))} style={{ width: 26, height: 26, borderRadius: 8, background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14, fontWeight: 900, color: '#6B7280', userSelect: 'none' } as any}>-</div>
        <div style={{ fontSize: 18, fontWeight: 900, color: '#111', minWidth: 30, textAlign: 'center' }}>{value}{suffix && <span style={{ fontSize: 9, color: '#9CA3AF' }}>{suffix}</span>}</div>
        <div onClick={() => onChange(Math.min(max, value + step))} style={{ width: 26, height: 26, borderRadius: 8, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 14, fontWeight: 900, color: '#FFF', userSelect: 'none' } as any}>+</div>
      </div>
    </div>
  );
}

/* ── WeightChart: SVG line chart full-width, click point shows card below ── */
function WeightChart({ data, accent }: { data: any[]; accent: string }) {
  const [selected, setSelected] = useState<number | null>(null);
  const entries = data.slice(-12);
  if (entries.length < 2) return null;
  const weights = entries.map((w: any) => w.weight_kg);
  const minW = Math.min(...weights) - 2;
  const maxW = Math.max(...weights) + 2;
  const range = maxW - minW || 1;
  const W = 320, H = 110, padX = 10, padY = 12;
  const chartW = W - padX * 2, chartH = H - padY * 2;
  const points = entries.map((w: any, i: number) => ({
    x: padX + (i / (entries.length - 1)) * chartW,
    y: padY + chartH - ((w.weight_kg - minW) / range) * chartH,
    weight: w.weight_kg,
    date: w.date ? new Date(w.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '',
    dateShort: w.date ? new Date(w.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '',
  }));
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const sel = selected !== null ? points[selected] : null;

  return (
    <div data-testid="weight-chart" style={{ marginTop: 12 } as any}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Evolution du poids</div>
      <svg width="100%" viewBox={`0 0 ${W} ${H + 16}`} preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
        {/* Grid */}
        {[0, 0.5, 1].map((p, i) => (
          <line key={i} x1={padX} y1={padY + chartH * (1 - p)} x2={W - padX} y2={padY + chartH * (1 - p)} stroke="#E5E7EB" strokeWidth="0.5" strokeDasharray="4,4" />
        ))}
        {/* Area fill */}
        <path d={`${linePath} L${points[points.length - 1].x},${padY + chartH} L${points[0].x},${padY + chartH} Z`} fill={`${accent}10`} />
        {/* Line */}
        <path d={linePath} fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={selected === i ? 6 : 3.5} fill={selected === i ? accent : '#FFF'} stroke={accent} strokeWidth="2" onClick={() => setSelected(selected === i ? null : i)} style={{ cursor: 'pointer' }} />
        ))}
        {/* X labels */}
        {points.filter((_, i) => i === 0 || i === points.length - 1).map((p, i) => (
          <text key={`l-${i}`} x={p.x} y={H + 12} textAnchor={i === 0 ? 'start' : 'end'} fill="#9CA3AF" fontSize="8" fontWeight="600">{p.dateShort}</text>
        ))}
      </svg>
      {/* Selected point card */}
      {sel && (
        <div data-testid="weight-detail-card" style={{ marginTop: 8, padding: '10px 14px', borderRadius: 12, background: '#FFF', border: `1.5px solid ${accent}20`, display: 'flex', alignItems: 'center', gap: 12 } as any}>
          <div style={{ width: 8, height: 8, borderRadius: 4, background: accent, flexShrink: 0 } as any} />
          <div style={{ flex: 1 } as any}>
            <div style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 600 }}>{sel.date}</div>
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#111' }}>{sel.weight}<span style={{ fontSize: 11, color: '#9CA3AF', marginLeft: 2 }}>kg</span></div>
        </div>
      )}
    </div>
  );
}


/* ── WorkoutPopup: Full-screen immersive workout flow ── */
function WorkoutPopup({ ex, totalSets, currentSet, setCurrentSet, resting, setResting, restTime, setRestTime, restRef, accent, onClose, startRest }: any) {
  const steps = (ex?.steps || []).filter((s: string) => s?.trim());
  const reps = ex?.repetitions || ex?.reps || 12;
  const restSec = ex?.rest_seconds || 60;
  const finished = currentSet > totalSets;

  // Progress ring for rest timer
  const ringSize = 180, ringStroke = 8;
  const ringR = (ringSize - ringStroke) / 2;
  const ringCirc = 2 * Math.PI * ringR;
  const ringPct = restSec > 0 ? restTime / restSec : 0;

  return (
    <div data-testid="workout-popup" style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#0A0A0F', fontFamily: "'Inter', system-ui, sans-serif", display: 'flex', flexDirection: 'column', overflow: 'hidden' } as any}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes wp-fade-in { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes wp-pulse { 0%,100% { transform:scale(1); } 50% { transform:scale(1.04); } }
        @keyframes wp-ring-glow { 0%,100% { filter: drop-shadow(0 0 8px ${accent}40); } 50% { filter: drop-shadow(0 0 20px ${accent}60); } }
      `}} />

      {/* Top bar */}
      <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 } as any}>
        <div data-testid="workout-close-btn" onClick={onClose} style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
          <i className="ri-close-line" style={{ fontSize: 18, color: '#FFF' }} />
        </div>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{ex.title}</div>
        <div style={{ width: 40 }} />
      </div>

      {/* Progress dots */}
      <div style={{ display: 'flex', gap: 4, justifyContent: 'center', padding: '0 20px 16px' } as any}>
        {Array.from({ length: totalSets }).map((_, i) => (
          <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, maxWidth: 32, background: i < currentSet - (resting ? 0 : 1) ? accent : i === currentSet - 1 && !resting ? `${accent}60` : 'rgba(255,255,255,0.1)', transition: 'background 0.4s' } as any} />
        ))}
      </div>

      {/* Main content area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', overflow: 'auto' } as any}>

        {/* ── REST SCREEN ── */}
        {resting && !finished && (
          <div data-testid="workout-rest-screen" style={{ textAlign: 'center', animation: 'wp-fade-in 0.4s ease' } as any}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 24 }}>Temps de repos</div>
            {/* Ring timer */}
            <div style={{ position: 'relative', width: ringSize, height: ringSize, margin: '0 auto 24px', animation: 'wp-ring-glow 2s ease-in-out infinite' } as any}>
              <svg width={ringSize} height={ringSize} style={{ transform: 'rotate(-90deg)' }}>
                <circle cx={ringSize/2} cy={ringSize/2} r={ringR} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={ringStroke} />
                <circle cx={ringSize/2} cy={ringSize/2} r={ringR} fill="none" stroke={accent} strokeWidth={ringStroke} strokeDasharray={`${ringPct * ringCirc} ${ringCirc}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 1s linear' }} />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' } as any}>
                <div style={{ fontSize: 52, fontWeight: 900, color: '#FFF', fontVariantNumeric: 'tabular-nums', lineHeight: 1 } as any}>{Math.floor(restTime / 60)}:{String(restTime % 60).padStart(2, '0')}</div>
              </div>
            </div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>Prochaine serie : <strong style={{ color: '#FFF' }}>{currentSet + 1}/{totalSets}</strong></div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>{reps} reps</div>
            <div data-testid="skip-rest-btn" onClick={() => { clearInterval(restRef.current); setResting(false); setCurrentSet((s: number) => s + 1); }} style={{ marginTop: 32, padding: '14px 32px', borderRadius: 14, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#FFF', display: 'inline-block' } as any}>
              Passer le repos
            </div>
          </div>
        )}

        {/* ── EXERCISE SET SCREEN ── */}
        {!resting && !finished && (
          <div data-testid="workout-set-screen" style={{ textAlign: 'center', width: '100%', maxWidth: 380, animation: 'wp-fade-in 0.4s ease' } as any}>
            <div style={{ fontSize: 11, fontWeight: 700, color: accent, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 8 }}>Serie {currentSet} sur {totalSets}</div>
            <div style={{ fontSize: 64, fontWeight: 900, color: '#FFF', lineHeight: 1, marginBottom: 4, animation: 'wp-pulse 2s ease-in-out infinite' } as any}>{reps}</div>
            <div style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', fontWeight: 600, marginBottom: 32 }}>repetitions</div>

            {/* Steps reminder */}
            {steps.length > 0 && (
              <div style={{ textAlign: 'left', marginBottom: 32, padding: '16px', borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' } as any}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Rappel des etapes</div>
                {steps.map((step: string, i: number) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '6px 0', borderBottom: i < steps.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' } as any}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: accent, minWidth: 18, flexShrink: 0 }}>{i + 1}.</span>
                    <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{step}</span>
                  </div>
                ))}
              </div>
            )}

            <div data-testid="set-done-btn" onClick={() => { if (currentSet >= totalSets) { setCurrentSet((s: number) => s + 1); } else { startRest(); } }} style={{ padding: '18px', borderRadius: 16, background: currentSet >= totalSets ? '#10B981' : accent, textAlign: 'center', cursor: 'pointer', fontSize: 16, fontWeight: 800, color: '#FFF', transition: 'transform 0.12s' } as any}
              onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'scale(1.02)'; }}
              onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
              {currentSet >= totalSets ? 'Terminer l\'exercice' : 'Serie terminee'}
            </div>
          </div>
        )}

        {/* ── FINISHED SCREEN ── */}
        {finished && (
          <div data-testid="workout-finished-screen" style={{ textAlign: 'center', animation: 'wp-fade-in 0.5s ease' } as any}>
            <div style={{ width: 80, height: 80, borderRadius: 999, background: 'rgba(16,185,129,0.12)', border: '2px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' } as any}>
              <i className="ri-check-line" style={{ fontSize: 40, color: '#10B981' }} />
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#FFF', marginBottom: 8 }}>Bravo !</div>
            <div style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>{ex.title} termine</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', marginBottom: 40 }}>{totalSets} series x {reps} reps</div>
            <div data-testid="workout-finish-btn" onClick={onClose} style={{ padding: '16px 48px', borderRadius: 14, background: '#10B981', textAlign: 'center', cursor: 'pointer', fontSize: 15, fontWeight: 800, color: '#FFF', display: 'inline-block' } as any}>
              Fermer
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
