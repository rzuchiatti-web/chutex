import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { BG_IMAGES } from '../src/components/dashboard/constants';

const A = '#F59E0B', G = '#10B981', R = '#EF4444', B = '#60A5FA', P = '#A78BFA';
const GL: any = { borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' };
const CAT: Record<string, { icon: string; label: string; color: string; img: string }> = {
  cardio: { icon: 'ri-heart-pulse-line', label: 'Cardio', color: R, img: 'https://static.prod-images.emergentagent.com/jobs/151f0047-e744-48e3-8d63-62902a0935f7/images/05d45697f644e6b656496155421c6e39c60b73d67f7fb18522a76692b56fa394.png' },
  renforcement: { icon: 'ri-boxing-line', label: 'Renforcement', color: A, img: 'https://static.prod-images.emergentagent.com/jobs/151f0047-e744-48e3-8d63-62902a0935f7/images/b50d815f482c848c380f0e911d719876a2f9f0ff00967feef900297d858f39ef.png' },
  souplesse: { icon: 'ri-body-scan-line', label: 'Souplesse', color: P, img: 'https://static.prod-images.emergentagent.com/jobs/151f0047-e744-48e3-8d63-62902a0935f7/images/05d45697f644e6b656496155421c6e39c60b73d67f7fb18522a76692b56fa394.png' },
  equilibre: { icon: 'ri-walk-line', label: 'Equilibre', color: B, img: 'https://static.prod-images.emergentagent.com/jobs/151f0047-e744-48e3-8d63-62902a0935f7/images/05d45697f644e6b656496155421c6e39c60b73d67f7fb18522a76692b56fa394.png' },
};

export default function ExerciseDetailPage() {
  const { token } = useAuth();
  const router = useRouter();
  const { index } = useLocalSearchParams();
  const idx = Number(index ?? 0);
  const [ex, setEx] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);

  useEffect(() => { if (!token) return; apiFetch('/api/minceur/weight-details', {}, token).then(d => { const exercises = d?.recommendations?.exercises || []; if (exercises[idx]) setEx(exercises[idx]); setDone(!!d?.tracking?.completed?.[`exercise_${idx}`]); }).catch(() => {}).finally(() => setLoading(false)); }, [token, idx]);
  const toggle = async () => { setDone(!done); try { await apiFetch('/api/minceur/track', { method: 'POST', body: JSON.stringify({ type: 'exercise', index: idx }) }, token); } catch { setDone(done); } };

  if (Platform.OS !== 'web') return null;
  const cat = CAT[ex?.category] || CAT.cardio;
  const int = ex?.intensity || 'modere';
  const intC = int === 'leger' ? G : int === 'modere' ? A : R;

  return (
    <div data-testid="exercise-detail-page" style={{ position: 'absolute', inset: 0, fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' } as any}>
      <img src={BG_IMAGES.beneficiary} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1 } as any} />
      <div style={{ position: 'relative', zIndex: 5, height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 0 120px' } as any}>

          {/* Hero Image */}
          {!loading && ex && (
            <div style={{ position: 'relative', width: '100%', height: 260, overflow: 'hidden' } as any}>
              <img src={cat.img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' } as any} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.8) 75%)' } as any} />
              <div data-testid="back-button" onClick={() => router.back()} style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top, 16px) + 8px)', left: 16, width: 40, height: 40, borderRadius: 12, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' } as any}><i className="ri-arrow-left-line" style={{ fontSize: 18, color: '#FFF' }} /></div>
              <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20 } as any}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, background: `${cat.color}20`, border: `1px solid ${cat.color}30`, marginBottom: 8 } as any}>
                  <i className={cat.icon} style={{ fontSize: 11, color: cat.color }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: cat.color, textTransform: 'uppercase' }}>{cat.label}</span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', lineHeight: 1.2, textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>{ex.name}</div>
              </div>
            </div>
          )}

          <div style={{ padding: '0 20px' } as any}>
            {loading && <div style={{ textAlign: 'center', padding: '120px 0', color: 'rgba(255,255,255,0.3)' }}><div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.06)', borderTopColor: G, animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' } as any} /></div>}

            {!loading && ex && (
              <>
                {/* Stats — futuristic bar */}
                <div data-testid="exercise-hero" style={{ ...GL, padding: 0, marginTop: -30, marginBottom: 12, position: 'relative', zIndex: 10, overflow: 'hidden' } as any}>
                  <div style={{ display: 'flex' } as any}>
                    <div style={{ flex: 1, padding: '14px 12px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.04)' } as any}>
                      <i className="ri-timer-line" style={{ fontSize: 18, color: G, display: 'block', marginBottom: 4 }} />
                      <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF' }}>{ex.duration}</div>
                      <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', fontWeight: 700, textTransform: 'uppercase' }}>Duree</div>
                    </div>
                    {ex.calories_burned > 0 && (
                      <div style={{ flex: 1, padding: '14px 12px', textAlign: 'center', borderRight: '1px solid rgba(255,255,255,0.04)' } as any}>
                        <i className="ri-fire-line" style={{ fontSize: 18, color: A, display: 'block', marginBottom: 4 }} />
                        <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF' }}>{ex.calories_burned}<span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>kcal</span></div>
                        <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', fontWeight: 700, textTransform: 'uppercase' }}>Depense</div>
                      </div>
                    )}
                    <div style={{ flex: 1, padding: '14px 12px', textAlign: 'center' } as any}>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', background: intC, margin: '3px auto 7px', boxShadow: `0 0 12px ${intC}40` } as any} />
                      <div style={{ fontSize: 13, fontWeight: 900, color: intC, textTransform: 'capitalize' }}>{int}</div>
                      <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', fontWeight: 700, textTransform: 'uppercase' }}>Intensite</div>
                    </div>
                  </div>
                </div>

                {/* Track button */}
                <div data-testid="track-exercise-btn" onClick={toggle} style={{ ...GL, padding: '14px 20px', marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', background: done ? `${G}15` : 'rgba(255,255,255,0.05)', border: `1.5px solid ${done ? G : 'rgba(255,255,255,0.08)'}`, transition: 'all 0.3s' } as any}>
                  <i className={done ? 'ri-check-double-line' : 'ri-checkbox-blank-circle-line'} style={{ fontSize: 18, color: done ? G : 'rgba(255,255,255,0.25)' }} />
                  <span style={{ fontSize: 14, fontWeight: 800, color: done ? G : 'rgba(255,255,255,0.4)' }}>{done ? 'Exercice valide !' : 'Valider cet exercice'}</span>
                </div>

                {/* Instructions — step-by-step cards */}
                {ex.description && (
                  <div data-testid="exercise-instructions" style={{ ...GL, padding: 16, marginBottom: 12 } as any}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 } as any}>
                      <i className="ri-file-list-3-line" style={{ fontSize: 14, color: G }} />
                      <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1 }}>Instructions</span>
                    </div>
                    {/* Split description into sentences for card display */}
                    {ex.description.split('. ').filter((s: string) => s.trim()).map((step: string, i: number) => (
                      <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 10px', marginBottom: 6, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)', animation: `fadeSlide 0.3s ${i * 0.08}s ease both` } as any}>
                        <div style={{ width: 24, height: 24, borderRadius: 8, background: `${G}12`, border: `1px solid ${G}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, fontWeight: 900, color: G } as any}>{i + 1}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, flex: 1, paddingTop: 2 }}>{step.trim()}{step.trim().endsWith('.') ? '' : '.'}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Safety note */}
                <div style={{ ...GL, padding: '12px 14px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10, background: `${intC}06`, border: `1px solid ${intC}12` } as any}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: `${intC}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                    <i className="ri-shield-check-line" style={{ fontSize: 16, color: intC }} />
                  </div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>
                    {int === 'leger' ? 'Exercice doux, adapte a tous les niveaux.' : int === 'modere' ? 'Effort controle, ecoutez votre corps.' : 'Exercice soutenu, avec precaution.'} Arretez en cas de douleur ou d'essoufflement.
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes fadeSlide{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}` }} />
    </div>
  );
}
