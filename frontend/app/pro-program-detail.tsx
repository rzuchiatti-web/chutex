import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';

const BG = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/mhh7xwy3_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_08_43.png';
const GL: any = { borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' };

const CAT_COLORS: Record<string, string> = {
  force: '#DC2626', mobilite: '#F97316', cardio: '#EF4444', equilibre: '#3B82F6',
  souplesse: '#A78BFA', reeducation: '#10B981', general: '#6B7280',
};
const CAT_ICONS: Record<string, string> = {
  force: 'ri-boxing-line', mobilite: 'ri-body-scan-line', cardio: 'ri-heart-pulse-line',
  equilibre: 'ri-walk-line', souplesse: 'ri-body-scan-line', reeducation: 'ri-stethoscope-line',
  general: 'ri-calendar-check-line',
};

export default function ProProgramDétailPage() {
  const { token } = useAuth();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const programId = Array.isArray(id) ? id[0] : id;
  const [prog, setProg] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!programId || !token) return;
    setLoading(true);
    apiFetch(`/api/pro/programs/detail/${programId}`, {}, token)
      .then(d => setProg(d))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [programId, token]);

  if (Platform.OS !== 'web') return null;

  const cat = prog?.category || 'general';
  const accent = CAT_COLORS[cat] || '#6B7280';
  const catIcon = CAT_ICONS[cat] || 'ri-calendar-check-line';
  const sessions = prog?.sessions || [];
  const API = process.env.EXPO_PUBLIC_BACKEND_URL || '';

  return (
    <div data-testid="pro-program-detail-page" style={{ position: 'absolute', inset: 0, fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' } as any}>
      <img src={BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1 } as any} />
      <style dangerouslySetInnerHTML={{ __html: `@keyframes ppd-fade{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}@keyframes ppd-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}` }} />

      <div style={{ position: 'relative', zIndex: 5, height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 0 120px' } as any}>

          {/* Hero */}
          <div style={{ position: 'relative', width: '100%', minHeight: 260, overflow: 'hidden' } as any}>
            {prog?.image && <img src={prog.image.startsWith('/') ? `${API}${prog.image}` : prog.image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' } as any} />}
            <div style={{ position: 'absolute', inset: 0, background: prog?.image ? 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.8) 70%)' : 'transparent' } as any} />

            <div data-testid="pro-program-back-btn" onClick={() => router.back()}
              style={{ position: 'absolute', top: '70px', left: 16, width: 40, height: 40, borderRadius: 12, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)', zIndex: 10 } as any}>
              <i className="ri-arrow-left-line" style={{ fontSize: 18, color: '#FFF' }} />
            </div>

            {!loading && prog && (
              <div style={{ position: 'relative', zIndex: 2, padding: '80px 20px 24px' } as any}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: `${accent}20`, border: `1px solid ${accent}30`, marginBottom: 10 } as any}>
                  <i className={catIcon} style={{ fontSize: 11, color: accent }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: accent, textTransform: 'uppercase' }}>{cat}</span>
                </div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', lineHeight: 1.2, textShadow: '0 2px 12px rgba(0,0,0,0.5)', marginBottom: 6 }}>{prog.title}</div>
                {prog.beneficiary_name && prog.beneficiary_name !== 'Bibliotheque' && (
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: 5 } as any}>
                    <i className="ri-user-line" style={{ fontSize: 12 }} /> {prog.beneficiary_name}
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ padding: '0 20px' } as any}>
            {loading && (
              <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.3)' } as any}>
                <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.06)', borderTopColor: accent, animation: 'ppd-spin 0.8s linear infinite', margin: '0 auto 12px' } as any} />
              </div>
            )}

            {!loading && prog && (
              <>
                {/* Stats bar */}
                <div data-testid="pro-program-stats" style={{ ...GL, padding: 0, marginTop: 12, marginBottom: 12, overflow: 'hidden' } as any}>
                  <div style={{ display: 'flex' } as any}>
                    <div style={{ flex: 1, padding: '14px 12px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.04)' } as any}>
                      <i className="ri-calendar-check-line" style={{ fontSize: 18, color: accent, display: 'block', marginBottom: 4 }} />
                      <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF' }}>{prog.frequency || '—'}</div>
                      <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', fontWeight: 700, textTransform: 'uppercase' }}>Frequence</div>
                    </div>
                    <div style={{ flex: 1, padding: '14px 12px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.04)' } as any}>
                      <i className="ri-timer-line" style={{ fontSize: 18, color: '#10B981', display: 'block', marginBottom: 4 }} />
                      <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF' }}>{prog.duration_weeks || '—'}<span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}> sem.</span></div>
                      <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', fontWeight: 700, textTransform: 'uppercase' }}>Durée</div>
                    </div>
                    <div style={{ flex: 1, padding: '14px 12px', textAlign: 'center' } as any}>
                      <i className="ri-list-check-2" style={{ fontSize: 18, color: '#F59E0B', display: 'block', marginBottom: 4 }} />
                      <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF' }}>{sessions.length}</div>
                      <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', fontWeight: 700, textTransform: 'uppercase' }}>Exercices</div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                {prog.description && (
                  <div data-testid="pro-program-description" style={{ ...GL, padding: 16, marginBottom: 12 } as any}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 } as any}>
                      <i className="ri-file-text-line" style={{ fontSize: 14, color: accent }} />
                      <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1 }}>Description</span>
                    </div>
                    <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7 }}>{prog.description}</div>
                  </div>
                )}

                {/* Sessions / Exercises */}
                {sessions.length > 0 && (
                  <div data-testid="pro-program-sessions" style={{ ...GL, padding: 16, marginBottom: 12 } as any}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 } as any}>
                      <i className="ri-list-check-2" style={{ fontSize: 14, color: accent }} />
                      <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1 }}>Exercices / Etapes</span>
                    </div>
                    {sessions.map((s: any, i: number) => (
                      <div key={s.id || i} data-testid={`pro-session-card-${i}`}
                        style={{ display: 'flex', gap: 12, padding: '14px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: 8, animation: `ppd-fade 0.3s ${i * 0.06}s ease both` } as any}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 } as any}>
                          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${accent}15`, border: `1px solid ${accent}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                            <span style={{ fontSize: 13, fontWeight: 900, color: accent }}>{'0' + (i + 1)}</span>
                          </div>
                        </div>
                        <div style={{ flex: 1 } as any}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF', marginBottom: 4 }}>{s.title}</div>
                          {s.description && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, marginBottom: 6 }}>{s.description}</div>}
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' } as any}>
                            {s.sets > 0 && (
                              <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)' } as any}>{s.sets} series</span>
                            )}
                            {s.repetitions > 0 && (
                              <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)' } as any}>{s.repetitions} reps</span>
                            )}
                            {s.duration_min > 0 && (
                              <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.35)' } as any}>{s.duration_min} min</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Info card */}
                <div style={{ ...GL, padding: '12px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, background: `${accent}08`, border: `1px solid ${accent}15` } as any}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: `${accent}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                    <i className="ri-information-line" style={{ fontSize: 16, color: accent }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
                    Programme créé le {prog.created_at ? new Date(prog.created_at).toLocaleDateString('fr-FR') : '—'}
                    {prog.professional_name && ` par ${prog.professional_name}`}
                  </div>
                </div>
              </>
            )}

            {!loading && !prog && (
              <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.4)' } as any}>
                <i className="ri-error-warning-line" style={{ fontSize: 32, display: 'block', marginBottom: 8 }} />
                <div style={{ fontSize: 14, fontWeight: 600 }}>Programme non trouve</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
