import React, { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';

const BG = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/mhh7xwy3_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_08_43.png';
const DIFF_COLORS: Record<string, string> = { facile: '#10B981', moyen: '#F59E0B', difficile: '#EF4444' };
const DIFF_LABELS: Record<string, string> = { facile: 'Facile', moyen: 'Moyen', difficile: 'Difficile' };
const INP: any = { width: '100%', padding: '12px 14px', borderRadius: 12, background: '#F4F4F5', border: '1px solid #E5E7EB', color: '#111', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };

export default function ProExerciseDetailPage() {
  const { token } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const exerciseId = Array.isArray(params.id) ? params.id[0] : params.id;
  const mode = (Array.isArray(params.mode) ? params.mode[0] : params.mode) || 'template';
  const programId = Array.isArray(params.programId) ? params.programId[0] : params.programId;
  const sessionId = Array.isArray(params.sessionId) ? params.sessionId[0] : params.sessionId;

  const [ex, setEx] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [painLevel, setPainLevel] = useState(0);
  const [notes, setNotes] = useState('');
  const API = process.env.EXPO_PUBLIC_BACKEND_URL || '';

  // Editable params for beneficiary
  const [editSets, setEditSets] = useState<number>(0);
  const [editReps, setEditReps] = useState<number>(0);
  const [editRest, setEditRest] = useState<number>(0);
  const [paramsChanged, setParamsChanged] = useState(false);
  const [savingParams, setSavingParams] = useState(false);

  // Weight tracking
  const [weightKg, setWeightKg] = useState<string>('');
  const [lastWeightKg, setLastWeightKg] = useState<number | null>(null);
  const [savingWeight, setSavingWeight] = useState(false);
  const [weightSaved, setWeightSaved] = useState(false);

  const assignmentId = (Array.isArray(params.assignmentId) ? params.assignmentId[0] : params.assignmentId) || exerciseId;

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    if (mode === 'template' && exerciseId) {
      apiFetch(`/api/pro/exercise-templates`, {}, token)
        .then(tpls => {
          const found = (tpls || []).find((t: any) => t.id === exerciseId) || null;
          setEx(found);
          if (found) initEditableParams(found);
        })
        .catch(() => {}).finally(() => setLoading(false));
    } else if (mode === 'assigned' && assignmentId) {
      apiFetch(`/api/pro/assigned-exercise-detail/${assignmentId}`, {}, token)
        .then((found: any) => {
          if (found) {
            setEx(found);
            initEditableParams(found);
            const today = new Date().toISOString().split('T')[0];
            if (found.completions?.some((c: any) => c.date?.startsWith(today) && c.status === 'done')) setCompleted(true);
            if (found.last_weight_kg != null) {
              setLastWeightKg(found.last_weight_kg);
              setWeightKg(String(found.last_weight_kg));
            }
          }
        })
        .catch(() => {}).finally(() => setLoading(false));
    } else if (mode === 'session' && programId && sessionId) {
      apiFetch(`/api/pro/programs/detail/${programId}`, {}, token)
        .then(prog => { const sess = (prog?.sessions || []).find((s: any) => s.id === sessionId); setEx(sess || null); if (sess) initEditableParams(sess); if (sess?.completions?.length > 0 && sess.completions[sess.completions.length - 1].status === 'done') setCompleted(true); })
        .catch(() => apiFetch(`/api/pro/my-programs`, {}, token).then(progs => { const prog = (progs || []).find((p: any) => p.id === programId); if (prog) { const sess = (prog.sessions || []).find((s: any) => s.id === sessionId); setEx(sess || null); if (sess) initEditableParams(sess); } }).catch(() => {}))
        .finally(() => setLoading(false));
    } else if (mode === 'create-self') {
      setLoading(false);
    }
  }, [exerciseId, programId, sessionId, mode, token]);

  const initEditableParams = (data: any) => {
    setEditSets(data.sets || 0);
    setEditReps(data.repetitions || data.reps || 0);
    setEditRest(data.rest_seconds || 0);
  };

  const handleComplete = async (status: string) => {
    if (completing) return; setCompleting(true);
    try {
      if (mode === 'assigned' && assignmentId) await apiFetch(`/api/pro/exercises/${assignmentId}/complete`, { method: 'POST', body: JSON.stringify({ status, pain_level: painLevel || null, patient_notes: notes }) }, token);
      else if (programId && sessionId) await apiFetch(`/api/pro/sessions/${programId}/${sessionId}/complete`, { method: 'POST', body: JSON.stringify({ status, pain_level: painLevel || null, patient_notes: notes }) }, token);
      if (status === 'done') setCompleted(true);
    } catch {} finally { setCompleting(false); }
  };

  const saveParams = async () => {
    if (!assignmentId || savingParams) return;
    setSavingParams(true);
    try {
      const updated = await apiFetch(`/api/pro/assigned-exercises/${assignmentId}/update-params`, { method: 'PUT', body: JSON.stringify({ sets: editSets, repetitions: editReps, rest_seconds: editRest }) }, token);
      if (updated) { setEx(updated); setParamsChanged(false); }
    } catch {} finally { setSavingParams(false); }
  };

  const saveWeight = async () => {
    if (!assignmentId || savingWeight || !weightKg) return;
    setSavingWeight(true);
    try {
      const res = await apiFetch(`/api/pro/assigned-exercises/${assignmentId}/save-weight`, { method: 'PUT', body: JSON.stringify({ weight_kg: parseFloat(weightKg) }) }, token);
      if (res?.last_weight_kg != null) {
        setLastWeightKg(res.last_weight_kg);
        setWeightSaved(true);
        setTimeout(() => setWeightSaved(false), 2000);
      }
    } catch {} finally { setSavingWeight(false); }
  };

  const handleParamChange = (field: string, value: number) => {
    if (field === 'sets') setEditSets(value);
    else if (field === 'reps') setEditReps(value);
    else if (field === 'rest') setEditRest(value);
    setParamsChanged(true);
  };

  if (Platform.OS !== 'web') return null;

  const accent = DIFF_COLORS[ex?.difficulty] || '#3B82F6';
  const icon = ex?.icon || 'ri-run-line';
  const steps = ex?.steps || [];
  const videoSrc = ex?.video_url || ex?.media_url || '';
  const isEditable = mode === 'assigned';
  const hasWeight = ex?.equipment && ex.equipment !== 'Aucun';

  return (
    <div data-testid="pro-exercise-detail-page" style={{ position: 'absolute', inset: 0, background: '#F5F5F5', fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden', display: 'flex', flexDirection: 'column' } as any}>
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>

        {/* HEADER */}
        <div style={{ position: 'relative', zIndex: 1, minHeight: 200 } as any}>
          {(() => {
            const imgSrc = ex?.image ? (ex.image.startsWith('/') ? `${API}${ex.image}` : ex.image) : '';
            return <img key={imgSrc || 'bg'} src={imgSrc || BG} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' } as any} />;
          })()}
          {ex?.image && <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.65) 100%)' } as any} />}
          <div style={{ position: 'relative', zIndex: 2, padding: '28px 20px 32px' } as any}>
            <div data-testid="pro-exercise-back-btn" onClick={() => router.back()} style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.15)', marginBottom: 16 } as any}>
              <i className="ri-arrow-left-line" style={{ fontSize: 18, color: '#FFF' }} />
            </div>
            {!loading && ex && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' } as any}>
                <div style={{ width: 56, height: 56, borderRadius: 18, background: `${accent}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, border: `2px solid ${accent}50` } as any}>
                  <i className={icon} style={{ fontSize: 26, color: '#FFF' }} />
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', marginBottom: 6, textAlign: 'center', textTransform: 'capitalize' }}>{ex.title}</div>
              </div>
            )}
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ padding: '20px 16px 120px', marginTop: -16, borderRadius: '24px 24px 0 0', background: '#FFF', position: 'relative', zIndex: 10, minHeight: 'calc(100vh - 240px)' } as any}>
          {loading && <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}><i className="ri-loader-4-line" style={{ fontSize: 28, animation: 'spin 0.8s linear infinite', display: 'block', marginBottom: 8 }} />Chargement...</div>}

          {!loading && ex && (
            <>
              {/* Exercise info tags */}
              {(ex.difficulty || ex.muscle_group || ex.equipment) && (
                <div data-testid="exercise-info" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 } as any}>
                  {ex.difficulty && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 12, background: `${accent}08`, border: `1px solid ${accent}15` } as any}>
                      <i className="ri-speed-line" style={{ fontSize: 14, color: accent }} />
                      <div><div style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 }}>Difficulte</div><div style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>{DIFF_LABELS[ex.difficulty] || ex.difficulty}</div></div>
                    </div>
                  )}
                  {ex.muscle_group && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 12, background: '#F4F4F5' } as any}>
                      <i className="ri-body-scan-line" style={{ fontSize: 14, color: '#6B7280' }} />
                      <div><div style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 }}>Zone</div><div style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>{ex.muscle_group}</div></div>
                    </div>
                  )}
                  {ex.equipment && ex.equipment !== 'Aucun' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 12, background: '#F4F4F5' } as any}>
                      <i className="ri-tools-line" style={{ fontSize: 14, color: '#6B7280' }} />
                      <div><div style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5 }}>Equipement</div><div style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>{ex.equipment}</div></div>
                    </div>
                  )}
                </div>
              )}

              {/* EDITABLE STATS — beneficiary can modify sets/reps/repos */}
              <div data-testid="exercise-stats" style={{ borderRadius: 16, background: '#F4F4F5', padding: 0, marginBottom: 14, overflow: 'hidden' } as any}>
                {isEditable ? (
                  <>
                    <div style={{ display: 'flex' } as any}>
                      <StatEditor label="Series" value={editSets} onChange={(v: number) => handleParamChange('sets', v)} min={1} max={20} accent={accent} />
                      <StatEditor label="Reps" value={editReps} onChange={(v: number) => handleParamChange('reps', v)} min={1} max={100} accent={accent} />
                      <StatEditor label="Repos" value={editRest} onChange={(v: number) => handleParamChange('rest', v)} min={0} max={300} step={5} suffix="s" accent={accent} />
                    </div>
                    {paramsChanged && (
                      <div data-testid="save-params-btn" onClick={saveParams} style={{ padding: '10px 16px', textAlign: 'center', cursor: 'pointer', borderTop: '1px solid #E5E7EB', fontSize: 12, fontWeight: 800, color: '#FFF', background: accent, transition: 'opacity 0.15s', opacity: savingParams ? 0.5 : 1 } as any}>
                        {savingParams ? 'Enregistrement...' : 'Enregistrer les modifications'}
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ display: 'flex' } as any}>
                    {ex.sets > 0 && <div style={{ flex: 1, padding: '14px 8px', textAlign: 'center', borderRight: '1px solid #E5E7EB' } as any}><div style={{ fontSize: 22, fontWeight: 900, color: '#111' }}>{ex.sets}</div><div style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginTop: 2 }}>Series</div></div>}
                    {(ex.repetitions > 0 || ex.reps > 0) && <div style={{ flex: 1, padding: '14px 8px', textAlign: 'center', borderRight: '1px solid #E5E7EB' } as any}><div style={{ fontSize: 22, fontWeight: 900, color: '#111' }}>{ex.repetitions || ex.reps}</div><div style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginTop: 2 }}>Reps</div></div>}
                    {ex.duration_min > 0 && <div style={{ flex: 1, padding: '14px 8px', textAlign: 'center', borderRight: '1px solid #E5E7EB' } as any}><div style={{ fontSize: 22, fontWeight: 900, color: '#111' }}>{ex.duration_min}<span style={{ fontSize: 10, color: '#9CA3AF' }}>min</span></div><div style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginTop: 2 }}>Duree</div></div>}
                    {(ex.rest_seconds > 0) && <div style={{ flex: 1, padding: '14px 8px', textAlign: 'center' } as any}><div style={{ fontSize: 22, fontWeight: 900, color: '#111' }}>{ex.rest_seconds}<span style={{ fontSize: 10, color: '#9CA3AF' }}>s</span></div><div style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginTop: 2 }}>Repos</div></div>}
                  </div>
                )}
              </div>

              {/* WEIGHT TRACKER — for exercises with equipment */}
              {isEditable && hasWeight && (
                <div data-testid="weight-tracker" style={{ borderRadius: 16, background: '#F4F4F5', padding: '14px 16px', marginBottom: 14 } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 } as any}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                      <i className="ri-scales-3-line" style={{ fontSize: 16, color: '#FFF' }} />
                    </div>
                    <div style={{ flex: 1 } as any}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>Poids utilise</div>
                      {lastWeightKg != null && (
                        <div style={{ fontSize: 10, color: '#6B7280', marginTop: 1 }}>Derniere seance : <strong style={{ color: accent }}>{lastWeightKg} kg</strong></div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' } as any}>
                    <div style={{ position: 'relative', flex: 1 } as any}>
                      <input
                        data-testid="weight-input"
                        type="number"
                        value={weightKg}
                        onChange={(e: any) => { setWeightKg(e.target.value); setWeightSaved(false); }}
                        placeholder={lastWeightKg ? `${lastWeightKg}` : 'Ex: 40'}
                        style={{ ...INP, paddingRight: 36 } as any}
                        min="0"
                        step="0.5"
                      />
                      <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, fontWeight: 700, color: '#9CA3AF' }}>kg</span>
                    </div>
                    <div
                      data-testid="save-weight-btn"
                      onClick={saveWeight}
                      style={{
                        padding: '12px 18px', borderRadius: 12, cursor: 'pointer', fontSize: 12, fontWeight: 800,
                        background: weightSaved ? '#10B981' : '#111', color: '#FFF',
                        transition: 'all 0.2s', opacity: savingWeight ? 0.5 : 1,
                        display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap',
                      } as any}
                    >
                      {weightSaved ? <><i className="ri-check-line" style={{ fontSize: 14 }} /> OK</> : savingWeight ? 'Enregistrement...' : 'Enregistrer'}
                    </div>
                  </div>
                  {/* Weight history */}
                  {ex.weight_history && ex.weight_history.length > 1 && (
                    <div style={{ marginTop: 10, padding: '8px 10px', borderRadius: 10, background: '#FFF' } as any}>
                      <div style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Historique poids</div>
                      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 2 } as any}>
                        {ex.weight_history.slice(-8).reverse().map((w: any, i: number) => (
                          <div key={i} style={{ flexShrink: 0, padding: '4px 10px', borderRadius: 8, background: i === 0 ? `${accent}12` : '#F4F4F5', border: i === 0 ? `1px solid ${accent}25` : '1px solid transparent', textAlign: 'center' } as any}>
                            <div style={{ fontSize: 13, fontWeight: 900, color: i === 0 ? accent : '#111' }}>{w.weight_kg}<span style={{ fontSize: 8, color: '#9CA3AF' }}>kg</span></div>
                            <div style={{ fontSize: 8, color: '#9CA3AF', marginTop: 1 }}>{w.date ? new Date(w.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : ''}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Description */}
              {ex.description && (
                <div style={{ borderRadius: 16, background: '#F4F4F5', padding: '14px 16px', marginBottom: 14 } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 } as any}>
                    <i className="ri-file-text-line" style={{ fontSize: 14, color: accent }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Description</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.7 }}>{ex.description}</div>
                </div>
              )}

              {/* Video */}
              {videoSrc && (
                <div style={{ borderRadius: 16, background: '#F4F4F5', padding: '14px 16px', marginBottom: 14 } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 } as any}>
                    <i className="ri-video-line" style={{ fontSize: 14, color: '#EF4444' }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Video</span>
                  </div>
                  {videoSrc.includes('youtube') || videoSrc.includes('youtu.be') ? (
                    <div style={{ borderRadius: 12, overflow: 'hidden', aspectRatio: '16/9' } as any}>
                      <iframe src={videoSrc.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')} style={{ width: '100%', height: '100%', border: 'none' } as any} allowFullScreen />
                    </div>
                  ) : (
                    <video src={videoSrc.startsWith('/') ? `${API}${videoSrc}` : videoSrc} controls style={{ width: '100%', borderRadius: 12 } as any} />
                  )}
                </div>
              )}

              {/* Steps */}
              {steps.length > 0 && steps.some((s: string) => s.trim()) && (
                <>
                  <div style={{ height: 1, background: '#E5E7EB', margin: '4px 0 14px' } as any} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 } as any}>
                    <i className="ri-list-ordered" style={{ fontSize: 16, color: accent }} />
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#111' }}>Etapes</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', background: '#E5E7EB', padding: '2px 8px', borderRadius: 999 }}>{steps.filter((s: string) => s.trim()).length}</span>
                  </div>
                  {steps.filter((s: string) => s.trim()).map((step: string, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 14px', borderRadius: 14, background: '#F4F4F5', marginBottom: 6 } as any}>
                      <span style={{ fontSize: 18, fontWeight: 900, color: '#111', flexShrink: 0, minWidth: 24 }}>{i + 1}.</span>
                      <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.6, flex: 1, paddingTop: 3 }}>{step}</div>
                    </div>
                  ))}
                </>
              )}

              {/* Completion (assigned/session) */}
              {(mode === 'session' || mode === 'assigned') && (assignmentId || (programId && sessionId)) && (
                <div style={{ borderRadius: 16, background: completed ? 'rgba(16,185,129,0.06)' : '#F4F4F5', border: completed ? '1px solid rgba(16,185,129,0.2)' : '1px solid transparent', padding: 16, marginTop: 14, marginBottom: 14 } as any}>
                  {completed ? (
                    (() => {
                      const today = new Date().toISOString().split('T')[0];
                      const lastComp = (ex.completions || []).filter((c: any) => c.date?.startsWith(today) && c.status === 'done').slice(-1)[0];
                      return (
                        <div data-testid="exercise-completed" style={{ padding: '12px 0' } as any}>
                          <div style={{ textAlign: 'center', marginBottom: lastComp?.pain_level || lastComp?.patient_notes ? 14 : 0 } as any}>
                            <i className="ri-checkbox-circle-fill" style={{ fontSize: 36, color: '#10B981', display: 'block', marginBottom: 8 }} />
                            <div style={{ fontSize: 16, fontWeight: 800, color: '#10B981' }}>Exercice valide !</div>
                          </div>
                          {lastComp?.pain_level > 0 && (
                            <div style={{ marginBottom: 10 } as any}>
                              <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 6, fontWeight: 600 }}>Niveau de douleur</div>
                              <div style={{ display: 'flex', gap: 4 } as any}>
                                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                                  <div key={n} style={{ flex: 1, height: 28, borderRadius: 6, background: n <= lastComp.pain_level ? (n <= 3 ? '#10B981' : n <= 6 ? '#F59E0B' : '#EF4444') : '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: n <= lastComp.pain_level ? '#FFF' : '#9CA3AF' } as any}>{n}</div>
                                ))}
                              </div>
                            </div>
                          )}
                          {lastComp?.patient_notes && (
                            <div style={{ padding: '10px 14px', borderRadius: 12, background: '#F4F4F5', marginTop: 8 } as any}>
                              <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4, fontWeight: 600 }}>Note du patient</div>
                              <div style={{ fontSize: 13, color: '#111', lineHeight: 1.6 }}>"{lastComp.patient_notes}"</div>
                            </div>
                          )}
                        </div>
                      );
                    })()
                  ) : (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 } as any}>
                        <i className="ri-checkbox-circle-line" style={{ fontSize: 14, color: '#10B981' }} />
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Validation</span>
                      </div>
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 6, fontWeight: 600 }}>Niveau de douleur</div>
                        <div style={{ display: 'flex', gap: 4 } as any}>
                          {[1,2,3,4,5,6,7,8,9,10].map(n => (
                            <div key={n} onClick={() => setPainLevel(n)} style={{ flex: 1, height: 28, borderRadius: 6, background: n <= painLevel ? (n <= 3 ? '#10B981' : n <= 6 ? '#F59E0B' : '#EF4444') : '#E5E7EB', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: n <= painLevel ? '#FFF' : '#9CA3AF', transition: 'all 0.15s' } as any}>{n}</div>
                          ))}
                        </div>
                      </div>
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 6, fontWeight: 600 }}>Notes</div>
                        <input data-testid="exercise-notes-input" value={notes} onChange={(e: any) => setNotes(e.target.value)} placeholder="Comment ca s'est passe ?" style={INP} />
                      </div>
                      <div style={{ display: 'flex', gap: 8 } as any}>
                        <div data-testid="validate-exercise-btn" onClick={() => handleComplete('done')} style={{ flex: 1, padding: '14px', borderRadius: 999, background: '#111', textAlign: 'center', cursor: 'pointer', fontSize: 14, fontWeight: 800, color: '#FFF', opacity: completing ? 0.5 : 1 } as any}>{completing ? 'Validation...' : 'Valider'}</div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}

          {!loading && !ex && mode !== 'create-self' && <div style={{ textAlign: 'center', padding: '80px 0', color: '#9CA3AF' } as any}><i className="ri-error-warning-line" style={{ fontSize: 32, display: 'block', marginBottom: 8 }} /><div style={{ fontSize: 14, fontWeight: 600 }}>Exercice non trouve</div></div>}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}` }} />
    </div>
  );
}


/* ── StatEditor: increment/decrement control for sets/reps/rest ── */
function StatEditor({ label, value, onChange, min = 0, max = 999, step = 1, suffix = '', accent = '#3B82F6' }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; step?: number; suffix?: string; accent?: string }) {
  const dec = () => onChange(Math.max(min, value - step));
  const inc = () => onChange(Math.min(max, value + step));
  return (
    <div data-testid={`stat-editor-${label.toLowerCase()}`} style={{ flex: 1, padding: '10px 6px', textAlign: 'center', borderRight: '1px solid #E5E7EB' } as any}>
      <div style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 6, letterSpacing: 0.5 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 } as any}>
        <div onClick={dec} style={{ width: 28, height: 28, borderRadius: 8, background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16, fontWeight: 900, color: '#6B7280', userSelect: 'none', transition: 'background 0.12s' } as any}
          onMouseEnter={(e: any) => { e.currentTarget.style.background = '#D1D5DB'; }}
          onMouseLeave={(e: any) => { e.currentTarget.style.background = '#E5E7EB'; }}>-</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: '#111', minWidth: 36, textAlign: 'center' }}>{value}{suffix && <span style={{ fontSize: 9, color: '#9CA3AF' }}>{suffix}</span>}</div>
        <div onClick={inc} style={{ width: 28, height: 28, borderRadius: 8, background: accent, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 16, fontWeight: 900, color: '#FFF', userSelect: 'none', transition: 'opacity 0.12s' } as any}
          onMouseEnter={(e: any) => { e.currentTarget.style.opacity = '0.85'; }}
          onMouseLeave={(e: any) => { e.currentTarget.style.opacity = '1'; }}>+</div>
      </div>
    </div>
  );
}
