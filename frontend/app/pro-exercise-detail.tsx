import React, { useState, useEffect } from 'react';
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
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const API = process.env.EXPO_PUBLIC_BACKEND_URL || '';

  useEffect(() => {
    if (!token) return;
    setLoading(true);
    if (mode === 'template' && exerciseId) {
      apiFetch(`/api/pro/exercise-templates`, {}, token)
        .then(tpls => setEx((tpls || []).find((t: any) => t.id === exerciseId) || null))
        .catch(() => {}).finally(() => setLoading(false));
    } else if (mode === 'assigned' && (params.assignmentId || exerciseId)) {
      const aid = (Array.isArray(params.assignmentId) ? params.assignmentId[0] : params.assignmentId) || exerciseId;
      apiFetch(`/api/pro/assigned-exercise-detail/${aid}`, {}, token)
        .then((found: any) => { if (found) { setEx(found); const today = new Date().toISOString().split('T')[0]; if (found.completions?.some((c: any) => c.date?.startsWith(today) && c.status === 'done')) setCompleted(true); } })
        .catch(() => {}).finally(() => setLoading(false));
    } else if (mode === 'session' && programId && sessionId) {
      apiFetch(`/api/pro/programs/detail/${programId}`, {}, token)
        .then(prog => { const sess = (prog?.sessions || []).find((s: any) => s.id === sessionId); setEx(sess || null); if (sess?.completions?.length > 0 && sess.completions[sess.completions.length - 1].status === 'done') setCompleted(true); })
        .catch(() => apiFetch(`/api/pro/my-programs`, {}, token).then(progs => { const prog = (progs || []).find((p: any) => p.id === programId); if (prog) { const sess = (prog.sessions || []).find((s: any) => s.id === sessionId); setEx(sess || null); } }).catch(() => {}))
        .finally(() => setLoading(false));
    }
  }, [exerciseId, programId, sessionId, mode, token]);

  const handleComplete = async (status: string) => {
    if (completing) return; setCompleting(true);
    try {
      const aid = Array.isArray(params.assignmentId) ? params.assignmentId[0] : params.assignmentId;
      if (mode === 'assigned' && aid) await apiFetch(`/api/pro/exercises/${aid}/complete`, { method: 'POST', body: JSON.stringify({ status, pain_level: painLevel || null, patient_notes: notes }) }, token);
      else if (programId && sessionId) await apiFetch(`/api/pro/sessions/${programId}/${sessionId}/complete`, { method: 'POST', body: JSON.stringify({ status, pain_level: painLevel || null, patient_notes: notes }) }, token);
      if (status === 'done') setCompleted(true);
    } catch {} finally { setCompleting(false); }
  };

  const saveTemplate = async () => {
    if (!editForm || saving) return; setSaving(true);
    try { const updated = await apiFetch(`/api/pro/exercise-templates/${exerciseId}`, { method: 'PUT', body: JSON.stringify(editForm) }, token); if (updated) setEx(updated); setEditing(false); setEditForm(null); } catch {} finally { setSaving(false); }
  };

  if (Platform.OS !== 'web') return null;

  const accent = DIFF_COLORS[ex?.difficulty] || '#3B82F6';
  const icon = ex?.icon || 'ri-run-line';
  const steps = ex?.steps || [];
  const videoSrc = ex?.video_url || ex?.media_url || '';

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
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' } as any}>
                  {ex.difficulty && <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: `${accent}30`, color: '#FFF' }}>{DIFF_LABELS[ex.difficulty] || ex.difficulty}</span>}
                  {ex.muscle_group && <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)' }}>{ex.muscle_group}</span>}
                  {ex.equipment && ex.equipment !== 'Aucun' && <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)' }}>{ex.equipment}</span>}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ padding: '20px 16px 120px', marginTop: -16, borderRadius: '24px 24px 0 0', background: '#FFF', position: 'relative', zIndex: 10, minHeight: 'calc(100vh - 240px)' } as any}>
          {loading && <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}><i className="ri-loader-4-line" style={{ fontSize: 28, animation: 'spin 0.8s linear infinite', display: 'block', marginBottom: 8 }} />Chargement...</div>}

          {!loading && ex && (
            <>
              {/* Stats */}
              <div data-testid="exercise-stats" style={{ borderRadius: 16, background: '#F4F4F5', padding: 0, marginBottom: 14, overflow: 'hidden' } as any}>
                <div style={{ display: 'flex' } as any}>
                  {ex.sets > 0 && <div style={{ flex: 1, padding: '14px 8px', textAlign: 'center', borderRight: '1px solid #E5E7EB' } as any}><div style={{ fontSize: 22, fontWeight: 900, color: '#111' }}>{ex.sets}</div><div style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginTop: 2 }}>Series</div></div>}
                  {(ex.repetitions > 0 || ex.reps > 0) && <div style={{ flex: 1, padding: '14px 8px', textAlign: 'center', borderRight: '1px solid #E5E7EB' } as any}><div style={{ fontSize: 22, fontWeight: 900, color: '#111' }}>{ex.repetitions || ex.reps}</div><div style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginTop: 2 }}>Reps</div></div>}
                  {ex.duration_min > 0 && <div style={{ flex: 1, padding: '14px 8px', textAlign: 'center', borderRight: '1px solid #E5E7EB' } as any}><div style={{ fontSize: 22, fontWeight: 900, color: '#111' }}>{ex.duration_min}<span style={{ fontSize: 10, color: '#9CA3AF' }}>min</span></div><div style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginTop: 2 }}>Duree</div></div>}
                  {(ex.rest_seconds > 0) && <div style={{ flex: 1, padding: '14px 8px', textAlign: 'center' } as any}><div style={{ fontSize: 22, fontWeight: 900, color: '#111' }}>{ex.rest_seconds}<span style={{ fontSize: 10, color: '#9CA3AF' }}>s</span></div><div style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginTop: 2 }}>Repos</div></div>}
                </div>
              </div>

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

              {/* Edit (template mode) */}
              {mode === 'template' && !editing && (
                <div data-testid="edit-template-btn" onClick={() => { setEditForm({ title: ex.title, description: ex.description || '', sets: ex.sets || 0, repetitions: ex.repetitions || 0, rest_seconds: ex.rest_seconds || 0, duration_min: ex.duration_min || 0, difficulty: ex.difficulty || '', muscle_group: ex.muscle_group || '', equipment: ex.equipment || '', video_url: ex.video_url || '' }); setEditing(true); }}
                  style={{ borderRadius: 16, padding: '14px 16px', marginTop: 14, marginBottom: 14, textAlign: 'center', cursor: 'pointer', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' } as any}>
                  <i className="ri-pencil-line" style={{ fontSize: 16, color: '#3B82F6', marginRight: 8 }} />
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#3B82F6' }}>Modifier cet exercice</span>
                </div>
              )}

              {mode === 'template' && editing && editForm && (
                <div style={{ borderRadius: 16, background: '#F4F4F5', padding: 16, marginTop: 14, marginBottom: 14 } as any}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>Modifier l'exercice</div>
                  <div style={{ marginBottom: 10 }}><div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4, fontWeight: 600 }}>Titre</div><input value={editForm.title} onChange={(e: any) => setEditForm({ ...editForm, title: e.target.value })} style={INP} /></div>
                  <div style={{ marginBottom: 10 }}><div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4, fontWeight: 600 }}>Description</div><textarea value={editForm.description} onChange={(e: any) => setEditForm({ ...editForm, description: e.target.value })} rows={3} style={{ ...INP, resize: 'vertical' } as any} /></div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10 } as any}>
                    <div style={{ flex: 1 }}><div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4, fontWeight: 600 }}>Series</div><input type="number" value={editForm.sets} onChange={(e: any) => setEditForm({ ...editForm, sets: Number(e.target.value) })} style={INP} /></div>
                    <div style={{ flex: 1 }}><div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4, fontWeight: 600 }}>Reps</div><input type="number" value={editForm.repetitions} onChange={(e: any) => setEditForm({ ...editForm, repetitions: Number(e.target.value) })} style={INP} /></div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10 } as any}>
                    <div style={{ flex: 1 }}><div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4, fontWeight: 600 }}>Repos (s)</div><input type="number" value={editForm.rest_seconds} onChange={(e: any) => setEditForm({ ...editForm, rest_seconds: Number(e.target.value) })} style={INP} /></div>
                    <div style={{ flex: 1 }}><div style={{ fontSize: 11, color: '#6B7280', marginBottom: 4, fontWeight: 600 }}>Duree (min)</div><input type="number" value={editForm.duration_min} onChange={(e: any) => setEditForm({ ...editForm, duration_min: Number(e.target.value) })} style={INP} /></div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 } as any}>
                    <div data-testid="save-template-btn" onClick={saveTemplate} style={{ flex: 2, padding: '14px', borderRadius: 999, background: '#111', textAlign: 'center', cursor: 'pointer', fontSize: 14, fontWeight: 800, color: '#FFF', opacity: saving ? 0.5 : 1 } as any}>{saving ? 'Sauvegarde...' : 'Sauvegarder'}</div>
                    <div onClick={() => { setEditing(false); setEditForm(null); }} style={{ flex: 1, padding: '14px', borderRadius: 999, background: '#E5E7EB', textAlign: 'center', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#6B7280' } as any}>Annuler</div>
                  </div>
                </div>
              )}

              {/* Completion (assigned/session) */}
              {(mode === 'session' || mode === 'assigned') && (params.assignmentId || (programId && sessionId)) && (
                <div style={{ borderRadius: 16, background: completed ? 'rgba(16,185,129,0.06)' : '#F4F4F5', border: completed ? '1px solid rgba(16,185,129,0.2)' : '1px solid transparent', padding: 16, marginTop: 14, marginBottom: 14 } as any}>
                  {completed ? (
                    <div data-testid="exercise-completed" style={{ textAlign: 'center', padding: '12px 0' } as any}>
                      <i className="ri-checkbox-circle-fill" style={{ fontSize: 36, color: '#10B981', display: 'block', marginBottom: 8 }} />
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#10B981' }}>Exercice valide !</div>
                    </div>
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
                        <input value={notes} onChange={(e: any) => setNotes(e.target.value)} placeholder="Comment ca s'est passe ?" style={INP} />
                      </div>
                      <div style={{ display: 'flex', gap: 8 } as any}>
                        <div data-testid="validate-exercise-btn" onClick={() => handleComplete('done')} style={{ flex: 2, padding: '14px', borderRadius: 999, background: '#111', textAlign: 'center', cursor: 'pointer', fontSize: 14, fontWeight: 800, color: '#FFF', opacity: completing ? 0.5 : 1 } as any}>{completing ? 'Validation...' : 'Valider'}</div>
                        <div onClick={() => handleComplete('partial')} style={{ flex: 1, padding: '14px', borderRadius: 999, background: '#F59E0B15', textAlign: 'center', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#F59E0B' } as any}>Partiel</div>
                        <div onClick={() => handleComplete('skipped')} style={{ flex: 1, padding: '14px', borderRadius: 999, background: '#EF444415', textAlign: 'center', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#EF4444' } as any}>Passer</div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}

          {!loading && !ex && <div style={{ textAlign: 'center', padding: '80px 0', color: '#9CA3AF' } as any}><i className="ri-error-warning-line" style={{ fontSize: 32, display: 'block', marginBottom: 8 }} /><div style={{ fontSize: 14, fontWeight: 600 }}>Exercice non trouve</div></div>}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}` }} />
    </div>
  );
}
