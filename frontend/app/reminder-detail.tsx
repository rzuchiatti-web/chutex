import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';

const BG_HYDRA = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/v5t9l2mb_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_10_07.png';
const INP: any = { width: '100%', padding: '12px 14px', borderRadius: 12, background: '#F4F4F5', border: '1px solid #E5E7EB', color: '#111', fontSize: 13, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' };

const TYPE_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
  hydration: { label: 'Hydratation', icon: 'ri-drop-fill', color: '#38BDF8' },
  medication: { label: 'Complement', icon: 'ri-capsule-fill', color: '#F59E0B' },
};

export default function ReminderDétailPage() {
  const { token } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const assignmentId = Array.isArray(params.id) ? params.id[0] : params.id;
  const mode = (Array.isArray(params.mode) ? params.mode[0] : params.mode) || 'assigned';

  const [rem, setRem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [painLevel, setPainLevel] = useState(0);
  const [notes, setNotes] = useState('');
  const [completing, setCompleting] = useState(false);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!token || !assignmentId) return;
    apiFetch(`/api/pro/assigned-reminder-detail/${assignmentId}`, {}, token)
      .then(d => {
        if (d) {
          setRem(d);
          const today = new Date().toISOString().split('T')[0];
          if (d.completions?.some((c: any) => c.date?.startsWith(today) && c.status === 'done')) setCompleted(true);
        }
      }).catch(() => {}).finally(() => setLoading(false));
  }, [token, assignmentId]);

  const handleComplete = async (status: string) => {
    if (completing) return; setCompleting(true);
    try {
      await apiFetch(`/api/pro/reminders/${assignmentId}/complete`, { method: 'POST', body: JSON.stringify({ status, pain_level: painLevel || null, patient_notes: notes }) }, token);
      if (status === 'done') setCompleted(true);
    } catch {} finally { setCompleting(false); }
  };

  if (Platform.OS !== 'web') return null;

  const rtype = rem?.reminder_type || 'medication';
  const cfg = TYPE_CONFIG[rtype] || TYPE_CONFIG.medication;
  const ingredients = rem?.ingredients || [];
  const benefits = rem?.benefits || [];
  const API = process.env.EXPO_PUBLIC_BACKEND_URL || '';

  return (
    <div data-testid="reminder-detail-page" style={{ position: 'absolute', inset: 0, background: '#F5F5F5', fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden', display: 'flex', flexDirection: 'column' } as any}>
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>

        {/* HEADER */}
        <div style={{ position: 'relative', zIndex: 1, minHeight: 200 } as any}>
          {(() => {
            const imgSrc = rem?.image ? (rem.image.startsWith('/') ? `${API}${rem.image}` : rem.image) : BG_HYDRA;
            return <img key={imgSrc} src={imgSrc} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' } as any} />;
          })()}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: rem?.image ? 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.65) 100%)' : 'none' } as any} />
          <div style={{ position: 'relative', zIndex: 2, padding: '70px 20px 32px' } as any}>
            <div data-testid="reminder-back-btn" onClick={() => router.back()} style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.15)', marginBottom: 16 } as any}>
              <i className="ri-arrow-left-line" style={{ fontSize: 18, color: '#FFF' }} />
            </div>
            {!loading && rem && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' } as any}>
                <div style={{ width: 56, height: 56, borderRadius: 18, background: `${cfg.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, border: `2px solid ${cfg.color}50` } as any}>
                  <i className={cfg.icon} style={{ fontSize: 26, color: '#FFF' }} />
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: cfg.color, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{cfg.label}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', textAlign: 'center' }}>{rem.title}</div>
              </div>
            )}
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ padding: '20px 16px 120px', marginTop: -16, borderRadius: '24px 24px 0 0', background: '#FFF', position: 'relative', zIndex: 10, minHeight: 'calc(100vh - 160px)' } as any}>

          {loading && <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}><i className="ri-loader-4-line" style={{ fontSize: 28, animation: 'spin 0.8s linear infinite', display: 'block', marginBottom: 8 }} />Chargement...</div>}

          {!loading && rem && (
            <>
              {/* Info cards */}
              <div data-testid="reminder-info" style={{ display: 'flex', gap: 8, marginBottom: 14 } as any}>
                {rem.dosage && (
                  <div style={{ flex: 1, padding: '14px 12px', borderRadius: 14, background: '#F4F4F5', textAlign: 'center' } as any}>
                    <i className="ri-medicine-bottle-line" style={{ fontSize: 18, color: cfg.color, display: 'block', marginBottom: 4 }} />
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#111' }}>{rem.dosage}</div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginTop: 2 }}>Dosage</div>
                  </div>
                )}
                {rem.time && (
                  <div style={{ flex: 1, padding: '14px 12px', borderRadius: 14, background: '#F4F4F5', textAlign: 'center' } as any}>
                    <i className="ri-time-line" style={{ fontSize: 18, color: '#A78BFA', display: 'block', marginBottom: 4 }} />
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#111' }}>{rem.time}</div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginTop: 2 }}>Heure</div>
                  </div>
                )}
                {rem.volume_ml && (
                  <div style={{ flex: 1, padding: '14px 12px', borderRadius: 14, background: '#F4F4F5', textAlign: 'center' } as any}>
                    <i className="ri-goblet-line" style={{ fontSize: 18, color: '#38BDF8', display: 'block', marginBottom: 4 }} />
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#111' }}>{rem.volume_ml}<span style={{ fontSize: 10, color: '#9CA3AF' }}>ml</span></div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginTop: 2 }}>Volume</div>
                  </div>
                )}
                {rem.category && (
                  <div style={{ flex: 1, padding: '14px 12px', borderRadius: 14, background: '#F4F4F5', textAlign: 'center' } as any}>
                    <i className="ri-price-tag-3-line" style={{ fontSize: 18, color: '#10B981', display: 'block', marginBottom: 4 }} />
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#111' }}>{rem.category}</div>
                    <div style={{ fontSize: 9, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', marginTop: 2 }}>Type</div>
                  </div>
                )}
              </div>

              {/* Description */}
              {rem.description && (
                <div style={{ borderRadius: 16, background: '#F4F4F5', padding: '14px 16px', marginBottom: 14 } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 } as any}>
                    <i className="ri-file-text-line" style={{ fontSize: 14, color: cfg.color }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Description</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#6B7280', lineHeight: 1.7 }}>{rem.description}</div>
                </div>
              )}

              {/* Notes from pro */}
              {rem.notes && (
                <div style={{ borderRadius: 16, background: '#F4F4F5', padding: '12px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 } as any}>
                  <i className="ri-lightbulb-line" style={{ fontSize: 16, color: '#F59E0B', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5 }}>{rem.notes}</span>
                </div>
              )}

              {/* Ingredients */}
              {ingredients.length > 0 && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, marginTop: 6 } as any}>
                    <i className="ri-leaf-line" style={{ fontSize: 16, color: '#10B981' }} />
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#111' }}>Ingredients</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', background: '#E5E7EB', padding: '2px 8px', borderRadius: 999 }}>{ingredients.length}</span>
                  </div>
                  {ingredients.map((ing: any, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 14, background: '#F4F4F5', marginBottom: 6 } as any}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                        <i className="ri-leaf-fill" style={{ fontSize: 16, color: '#10B981' }} />
                      </div>
                      <div style={{ flex: 1 } as any}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{typeof ing === 'string' ? ing : ing.name}</div>
                      </div>
                      {typeof ing !== 'string' && ing.quantity && (
                        <span style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF' }}>{ing.quantity}</span>
                      )}
                    </div>
                  ))}
                </>
              )}

              {/* Benefits */}
              {benefits.length > 0 && (
                <>
                  <div style={{ height: 1, background: '#E5E7EB', margin: '14px 0' } as any} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 } as any}>
                    <i className="ri-heart-pulse-line" style={{ fontSize: 16, color: '#EF4444' }} />
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#111' }}>Bienfaits</span>
                  </div>
                  {benefits.map((b: string, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 14px', borderRadius: 14, background: '#F4F4F5', marginBottom: 6 } as any}>
                      <i className="ri-check-line" style={{ fontSize: 14, color: '#10B981', flexShrink: 0, marginTop: 2 }} />
                      <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.6 }}>{b}</div>
                    </div>
                  ))}
                </>
              )}

              {/* Prescriber info */}
              {rem.professional_name && (
                <div style={{ marginTop: 14, padding: '12px 16px', borderRadius: 14, background: '#F4F4F5', display: 'flex', alignItems: 'center', gap: 10 } as any}>
                  <i className="ri-user-heart-line" style={{ fontSize: 16, color: '#A78BFA', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#6B7280' }}>Prescrit par <strong style={{ color: '#111' }}>{rem.professional_name}</strong></span>
                </div>
              )}

              {/* Validation section (pain + notes) */}
              <div style={{ borderRadius: 16, background: completed ? 'rgba(16,185,129,0.06)' : '#F4F4F5', border: completed ? '1px solid rgba(16,185,129,0.2)' : '1px solid transparent', padding: 16, marginTop: 14, marginBottom: 14 } as any}>
                {completed ? (
                  (() => {
                    const today = new Date().toISOString().split('T')[0];
                    const lastComp = (rem.completions || []).filter((c: any) => c.date?.startsWith(today) && c.status === 'done').slice(-1)[0];
                    return (
                      <div data-testid="reminder-completed" style={{ padding: '12px 0' } as any}>
                        <div style={{ textAlign: 'center', marginBottom: lastComp?.pain_level || lastComp?.patient_notes ? 14 : 0 } as any}>
                          <i className="ri-checkbox-circle-fill" style={{ fontSize: 36, color: '#10B981', display: 'block', marginBottom: 8 }} />
                          <div style={{ fontSize: 16, fontWeight: 800, color: '#10B981' }}>{rtype === 'hydration' ? 'Hydratation validee !' : 'Complement valide !'}</div>
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
                      <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 6, fontWeight: 600 }}>Niveau de douleur / inconfort</div>
                      <div data-testid="reminder-pain-scale" style={{ display: 'flex', gap: 4 } as any}>
                        {[1,2,3,4,5,6,7,8,9,10].map(n => (
                          <div key={n} onClick={() => setPainLevel(n)} style={{ flex: 1, height: 28, borderRadius: 6, background: n <= painLevel ? (n <= 3 ? '#10B981' : n <= 6 ? '#F59E0B' : '#EF4444') : '#E5E7EB', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: n <= painLevel ? '#FFF' : '#9CA3AF', transition: 'all 0.15s' } as any}>{n}</div>
                        ))}
                      </div>
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 11, color: '#6B7280', marginBottom: 6, fontWeight: 600 }}>Notes</div>
                      <input data-testid="reminder-notes-input" value={notes} onChange={(e: any) => setNotes(e.target.value)} placeholder="Comment ca s'est passe ?" style={INP} />
                    </div>
                    <div style={{ display: 'flex', gap: 8 } as any}>
                      <div data-testid="validate-reminder-btn" onClick={() => handleComplete('done')} style={{ flex: 1, padding: '14px', borderRadius: 999, background: '#111', textAlign: 'center', cursor: 'pointer', fontSize: 14, fontWeight: 800, color: '#FFF', opacity: completing ? 0.5 : 1 } as any}>{completing ? 'Validation...' : 'Valider'}</div>
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          {!loading && !rem && <div style={{ textAlign: 'center', padding: '80px 0', color: '#9CA3AF' } as any}><i className="ri-error-warning-line" style={{ fontSize: 32, display: 'block', marginBottom: 8 }} /><div style={{ fontSize: 14, fontWeight: 600 }}>Rappel non trouve</div></div>}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}` }} />
    </div>
  );
}
