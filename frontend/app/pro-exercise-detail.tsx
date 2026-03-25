import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';

const BG = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/mhh7xwy3_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_08_43.png';
const GL: any = { borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' };

const DIFF_COLORS: Record<string, string> = { facile: '#10B981', moyen: '#F59E0B', difficile: '#EF4444' };

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

  useEffect(() => {
    if (!token) return;
    setLoading(true);

    if (mode === 'template' && exerciseId) {
      apiFetch(`/api/pro/exercise-templates`, {}, token)
        .then(tpls => {
          const found = (tpls || []).find((t: any) => t.id === exerciseId);
          setEx(found || null);
        }).catch(() => {}).finally(() => setLoading(false));
    } else if (mode === 'assigned' && (params.assignmentId || exerciseId)) {
      const aid = (Array.isArray(params.assignmentId) ? params.assignmentId[0] : params.assignmentId) || exerciseId;
      // Fetch from beneficiary or coach endpoint
      Promise.all([
        apiFetch(`/api/pro/beneficiary-all-exercises`, {}, token).catch(() => []),
        apiFetch(`/api/pro/assigned-exercises/${aid}`, {}, token).catch(() => []),
      ]).then(([benExs, proExs]) => {
        const allExs = [...(Array.isArray(benExs) ? benExs : []), ...(Array.isArray(proExs) ? proExs : [])];
        const found = allExs.find((e: any) => e.id === aid);
        if (found) {
          setEx(found);
          const today = new Date().toISOString().split('T')[0];
          if (found.completions?.some((c: any) => c.date?.startsWith(today) && c.status === 'done')) {
            setCompleted(true);
          }
        }
      }).catch(() => {}).finally(() => setLoading(false));
    } else if (mode === 'session' && programId && sessionId) {
      apiFetch(`/api/pro/programs/detail/${programId}`, {}, token)
        .then(prog => {
          const sess = (prog?.sessions || []).find((s: any) => s.id === sessionId);
          setEx(sess || null);
          if (sess?.completions?.length > 0) {
            const latest = sess.completions[sess.completions.length - 1];
            if (latest.status === 'done') setCompleted(true);
          }
        }).catch(() => {
          apiFetch(`/api/pro/my-programs`, {}, token).then(progs => {
            const prog = (progs || []).find((p: any) => p.id === programId);
            if (prog) {
              const sess = (prog.sessions || []).find((s: any) => s.id === sessionId);
              setEx(sess || null);
              if (sess?.completions?.length > 0) {
                const latest = sess.completions[sess.completions.length - 1];
                if (latest.status === 'done') setCompleted(true);
              }
            }
          }).catch(() => {});
        }).finally(() => setLoading(false));
    }
  }, [exerciseId, programId, sessionId, mode, token]);

  const handleComplete = async (status: string) => {
    if (completing) return;
    setCompleting(true);
    try {
      const aid = Array.isArray(params.assignmentId) ? params.assignmentId[0] : params.assignmentId;
      if (mode === 'assigned' && aid) {
        await apiFetch(`/api/pro/exercises/${aid}/complete`, {
          method: 'POST',
          body: JSON.stringify({ status, pain_level: painLevel || null, patient_notes: notes }),
        }, token);
      } else if (programId && sessionId) {
        await apiFetch(`/api/pro/sessions/${programId}/${sessionId}/complete`, {
          method: 'POST',
          body: JSON.stringify({ status, pain_level: painLevel || null, patient_notes: notes }),
        }, token);
      }
      if (status === 'done') setCompleted(true);
    } catch {} finally { setCompleting(false); }
  };

  if (Platform.OS !== 'web') return null;

  const accent = DIFF_COLORS[ex?.difficulty] || '#3B82F6';
  const steps = ex?.steps || [];
  const imgSrc = ex?.image ? (ex.image.startsWith('/') ? `${API}${ex.image}` : ex.image) : null;
  const videoSrc = ex?.video_url || ex?.media_url || '';

  return (
    <div data-testid="pro-exercise-detail-page" style={{ position: 'absolute', inset: 0, fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' } as any}>
      <img src={BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 1 } as any} />
      <style dangerouslySetInnerHTML={{ __html: `@keyframes ped-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes ped-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}` }} />

      <div style={{ position: 'relative', zIndex: 5, height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 0 120px' } as any}>

          {/* Hero with image */}
          <div style={{ position: 'relative', width: '100%', minHeight: imgSrc ? 280 : 160, overflow: 'hidden' } as any}>
            {imgSrc && <img src={imgSrc} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' } as any} />}
            <div style={{ position: 'absolute', inset: 0, background: imgSrc ? 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.85) 70%)' : 'transparent' } as any} />

            <div data-testid="pro-exercise-back-btn" onClick={() => router.back()}
              style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top, 16px) + 8px)', left: 16, width: 40, height: 40, borderRadius: 12, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', zIndex: 10 } as any}>
              <i className="ri-arrow-left-line" style={{ fontSize: 18, color: '#FFF' }} />
            </div>

            {!loading && ex && (
              <div style={{ position: 'relative', zIndex: 2, padding: imgSrc ? '120px 20px 24px' : '80px 20px 24px' } as any}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' } as any}>
                  {ex.difficulty && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: `${accent}20`, border: `1px solid ${accent}30`, color: accent, textTransform: 'uppercase' }}>{ex.difficulty}</span>
                  )}
                  {ex.muscle_group && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>{ex.muscle_group}</span>
                  )}
                  {ex.equipment && (
                    <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>{ex.equipment}</span>
                  )}
                </div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', lineHeight: 1.2, textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>{ex.title}</div>
              </div>
            )}
          </div>

          <div style={{ padding: '0 20px' } as any}>
            {loading && (
              <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.3)' } as any}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.06)', borderTopColor: accent, animation: 'ped-spin 0.8s linear infinite', margin: '0 auto 12px' } as any} />
              </div>
            )}

            {!loading && ex && (
              <>
                {/* Stats bar */}
                <div style={{ ...GL, padding: 0, marginTop: 12, marginBottom: 12, overflow: 'hidden' } as any}>
                  <div style={{ display: 'flex' } as any}>
                    {ex.sets > 0 && (
                      <div style={{ flex: 1, padding: '14px 12px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.04)' } as any}>
                        <i className="ri-repeat-line" style={{ fontSize: 18, color: '#3B82F6', display: 'block', marginBottom: 4 }} />
                        <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF' }}>{ex.sets}</div>
                        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', fontWeight: 700, textTransform: 'uppercase' }}>Series</div>
                      </div>
                    )}
                    {(ex.repetitions > 0 || ex.reps > 0) && (
                      <div style={{ flex: 1, padding: '14px 12px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.04)' } as any}>
                        <i className="ri-restart-line" style={{ fontSize: 18, color: '#10B981', display: 'block', marginBottom: 4 }} />
                        <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF' }}>{ex.repetitions || ex.reps}</div>
                        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', fontWeight: 700, textTransform: 'uppercase' }}>Reps</div>
                      </div>
                    )}
                    {(ex.duration_min > 0) && (
                      <div style={{ flex: 1, padding: '14px 12px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.04)' } as any}>
                        <i className="ri-timer-line" style={{ fontSize: 18, color: '#F59E0B', display: 'block', marginBottom: 4 }} />
                        <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF' }}>{ex.duration_min}<span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}> min</span></div>
                        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', fontWeight: 700, textTransform: 'uppercase' }}>Duree</div>
                      </div>
                    )}
                    {(ex.rest_seconds > 0 || ex.rest_sec > 0) && (
                      <div style={{ flex: 1, padding: '14px 12px', textAlign: 'center' } as any}>
                        <i className="ri-pause-circle-line" style={{ fontSize: 18, color: '#A78BFA', display: 'block', marginBottom: 4 }} />
                        <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF' }}>{ex.rest_seconds || ex.rest_sec}<span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}> s</span></div>
                        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', fontWeight: 700, textTransform: 'uppercase' }}>Repos</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Description */}
                {ex.description && (
                  <div data-testid="pro-exercise-description" style={{ ...GL, padding: 16, marginBottom: 12 } as any}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 } as any}>
                      <i className="ri-file-text-line" style={{ fontSize: 14, color: accent }} />
                      <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1 }}>Description</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>{ex.description}</div>
                  </div>
                )}

                {/* Video */}
                {videoSrc && (
                  <div style={{ ...GL, padding: 16, marginBottom: 12 } as any}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 } as any}>
                      <i className="ri-video-line" style={{ fontSize: 14, color: '#EF4444' }} />
                      <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1 }}>Video</span>
                    </div>
                    {videoSrc.includes('youtube') || videoSrc.includes('youtu.be') ? (
                      <div style={{ borderRadius: 12, overflow: 'hidden', aspectRatio: '16/9' } as any}>
                        <iframe src={videoSrc.replace('watch?v=', 'embed/').replace('youtu.be/', 'www.youtube.com/embed/')} style={{ width: '100%', height: '100%', border: 'none' } as any} allowFullScreen />
                      </div>
                    ) : (
                      <video src={videoSrc} controls style={{ width: '100%', borderRadius: 12 } as any} />
                    )}
                  </div>
                )}

                {/* Steps */}
                {steps.length > 0 && steps.some((s: string) => s.trim()) && (
                  <div data-testid="pro-exercise-steps" style={{ ...GL, padding: 16, marginBottom: 12 } as any}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 } as any}>
                      <i className="ri-list-ordered" style={{ fontSize: 14, color: accent }} />
                      <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1 }}>Etapes</span>
                    </div>
                    {steps.filter((s: string) => s.trim()).map((step: string, i: number) => (
                      <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10, animation: `ped-fade 0.3s ${i * 0.06}s ease both` } as any}>
                        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${accent}15`, border: `1px solid ${accent}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                          <span style={{ fontSize: 12, fontWeight: 900, color: accent }}>{i + 1}</span>
                        </div>
                        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, paddingTop: 4 }}>{step}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Completion section (for assigned/session mode) */}
                {(mode === 'session' || mode === 'assigned') && (params.assignmentId || (programId && sessionId)) && (
                  <div style={{ ...GL, padding: 16, marginBottom: 12, background: completed ? 'rgba(16,185,129,0.08)' : 'rgba(255,255,255,0.05)', border: completed ? '1px solid rgba(16,185,129,0.2)' : '1px solid rgba(255,255,255,0.08)' } as any}>
                    {completed ? (
                      <div data-testid="exercise-completed" style={{ textAlign: 'center', padding: '12px 0' } as any}>
                        <i className="ri-checkbox-circle-fill" style={{ fontSize: 36, color: '#10B981', display: 'block', marginBottom: 8 }} />
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#10B981' }}>Exercice valide !</div>
                      </div>
                    ) : (
                      <>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 } as any}>
                          <i className="ri-checkbox-circle-line" style={{ fontSize: 14, color: '#10B981' }} />
                          <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1 }}>Validation</span>
                        </div>
                        <div style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 6, fontWeight: 600 }}>Niveau de douleur (optionnel)</div>
                          <div style={{ display: 'flex', gap: 4 } as any}>
                            {[1,2,3,4,5,6,7,8,9,10].map(n => (
                              <div key={n} onClick={() => setPainLevel(n)}
                                style={{ flex: 1, height: 28, borderRadius: 6, background: n <= painLevel ? (n <= 3 ? '#10B981' : n <= 6 ? '#F59E0B' : '#EF4444') : 'rgba(255,255,255,0.06)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: n <= painLevel ? '#FFF' : 'rgba(255,255,255,0.2)', transition: 'all 0.15s' } as any}>
                                {n}
                              </div>
                            ))}
                          </div>
                        </div>
                        <div style={{ marginBottom: 14 }}>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 6, fontWeight: 600 }}>Notes (optionnel)</div>
                          <input value={notes} onChange={(e: any) => setNotes(e.target.value)} placeholder="Comment ca s'est passe ?"
                            style={{ width: '100%', padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' } as any} />
                        </div>
                        <div style={{ display: 'flex', gap: 8 } as any}>
                          <div data-testid="validate-exercise-btn" onClick={() => handleComplete('done')}
                            style={{ flex: 2, padding: '14px', borderRadius: 12, background: '#10B981', textAlign: 'center', cursor: 'pointer', fontSize: 14, fontWeight: 800, color: '#FFF', opacity: completing ? 0.5 : 1 } as any}>
                            {completing ? 'Validation...' : 'Valider'}
                          </div>
                          <div onClick={() => handleComplete('partial')}
                            style={{ flex: 1, padding: '14px', borderRadius: 12, background: 'rgba(245,158,11,0.15)', textAlign: 'center', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#F59E0B' } as any}>
                            Partiel
                          </div>
                          <div onClick={() => handleComplete('skipped')}
                            style={{ flex: 1, padding: '14px', borderRadius: 12, background: 'rgba(239,68,68,0.1)', textAlign: 'center', cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#EF4444' } as any}>
                            Passer
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </>
            )}

            {!loading && !ex && (
              <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.4)' } as any}>
                <i className="ri-error-warning-line" style={{ fontSize: 32, display: 'block', marginBottom: 8 }} />
                <div style={{ fontSize: 14, fontWeight: 600 }}>Exercice non trouve</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
