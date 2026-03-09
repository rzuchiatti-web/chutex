import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { BG_IMAGES } from '../src/components/dashboard/constants';

const ACCENT = '#F59E0B';
const GREEN = '#10B981';
const RED = '#EF4444';
const C: any = { borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' };
const CAT_META: Record<string, { icon: string; label: string; color: string; img: string }> = {
  cardio: { icon: 'ri-heart-pulse-line', label: 'Cardio', color: RED, img: 'https://static.prod-images.emergentagent.com/jobs/151f0047-e744-48e3-8d63-62902a0935f7/images/05d45697f644e6b656496155421c6e39c60b73d67f7fb18522a76692b56fa394.png' },
  renforcement: { icon: 'ri-boxing-line', label: 'Renforcement', color: ACCENT, img: 'https://static.prod-images.emergentagent.com/jobs/151f0047-e744-48e3-8d63-62902a0935f7/images/b50d815f482c848c380f0e911d719876a2f9f0ff00967feef900297d858f39ef.png' },
  souplesse: { icon: 'ri-body-scan-line', label: 'Souplesse', color: '#A78BFA', img: 'https://static.prod-images.emergentagent.com/jobs/151f0047-e744-48e3-8d63-62902a0935f7/images/05d45697f644e6b656496155421c6e39c60b73d67f7fb18522a76692b56fa394.png' },
  equilibre: { icon: 'ri-walk-line', label: 'Equilibre', color: '#60A5FA', img: 'https://static.prod-images.emergentagent.com/jobs/151f0047-e744-48e3-8d63-62902a0935f7/images/05d45697f644e6b656496155421c6e39c60b73d67f7fb18522a76692b56fa394.png' },
};

export default function ExerciseDetailPage() {
  const { token } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const exIndex = Number(params.index ?? 0);
  const [exercise, setExercise] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (!token) return;
    apiFetch('/api/minceur/weight-details', {}, token).then(d => {
      const exercises = d?.recommendations?.exercises || [];
      if (exercises[exIndex]) setExercise(exercises[exIndex]);
      const completed = d?.tracking?.completed || {};
      setIsDone(!!completed[`exercise_${exIndex}`]);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [token, exIndex]);

  const toggleTrack = async () => {
    setIsDone(!isDone);
    try {
      await apiFetch('/api/minceur/track', { method: 'POST', body: JSON.stringify({ type: 'exercise', index: exIndex }) }, token);
    } catch { setIsDone(isDone); }
  };

  if (Platform.OS !== 'web') return null;
  const ex = exercise;
  const cat = CAT_META[ex?.category] || CAT_META.cardio;
  const int = ex?.intensity || 'modere';
  const intColor = int === 'leger' ? GREEN : int === 'modere' ? ACCENT : RED;
  const intLabel = int === 'leger' ? 'Leger - adapte a tous' : int === 'modere' ? 'Modere - effort controle' : 'Intense - avec precaution';

  return (
    <div data-testid="exercise-detail-page" style={{ position: 'absolute', inset: 0, fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' } as any}>
      <img src={BG_IMAGES.beneficiary} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1 } as any} />
      <div style={{ position: 'relative', zIndex: 5, height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: 'calc(env(safe-area-inset-top, 20px) + 12px) 20px 120px' } as any}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 } as any}>
            <div data-testid="back-button" onClick={() => router.back()} style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
              <i className="ri-arrow-left-line" style={{ fontSize: 18, color: '#FFF' }} />
            </div>
            <div style={{ flex: 1 } as any}>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF' }}>Detail de l'exercice</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Instructions et suivi</div>
            </div>
          </div>

          {loading && <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.3)' }}><div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.06)', borderTopColor: GREEN, animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' } as any} />Chargement...</div>}
          {!loading && !ex && <div style={{ ...C, padding: 32, textAlign: 'center' } as any}><div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>Exercice introuvable</div></div>}

          {!loading && ex && (
            <>
              {/* Exercise Hero */}
              <div data-testid="exercise-hero" style={{ ...C, padding: 0, marginBottom: 12, overflow: 'hidden' } as any}>
                <img src={cat.img} alt="" style={{ width: '100%', height: 140, objectFit: 'cover' } as any} />
                <div style={{ padding: '16px 20px' } as any}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 } as any}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: `${GREEN}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                    <i className={cat.icon} style={{ fontSize: 22, color: GREEN }} />
                  </div>
                  <div style={{ flex: 1 } as any}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: GREEN, textTransform: 'uppercase', letterSpacing: 1 }}>{cat.label}</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF', lineHeight: 1.2 }}>{ex.name}</div>
                  </div>
                </div>

                {/* Stats row */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 16 } as any}>
                  <div style={{ flex: 1, padding: '10px 8px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', textAlign: 'center' } as any}>
                    <i className="ri-timer-line" style={{ fontSize: 16, color: GREEN, display: 'block', marginBottom: 4 }} />
                    <div style={{ fontSize: 16, fontWeight: 900, color: '#FFF' }}>{ex.duration}</div>
                    <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', fontWeight: 700 }}>Duree</div>
                  </div>
                  {ex.calories_burned > 0 && (
                    <div style={{ flex: 1, padding: '10px 8px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', textAlign: 'center' } as any}>
                      <i className="ri-fire-line" style={{ fontSize: 16, color: ACCENT, display: 'block', marginBottom: 4 }} />
                      <div style={{ fontSize: 16, fontWeight: 900, color: '#FFF' }}>{ex.calories_burned}<span style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)' }}>kcal</span></div>
                      <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', fontWeight: 700 }}>Depense</div>
                    </div>
                  )}
                  <div style={{ flex: 1, padding: '10px 8px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', textAlign: 'center' } as any}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: intColor, margin: '4px auto 8px' } as any} />
                    <div style={{ fontSize: 12, fontWeight: 900, color: intColor }}>{int}</div>
                    <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.2)', fontWeight: 700 }}>Intensite</div>
                  </div>
                </div>

                {/* Track button */}
                <div data-testid="track-exercise-btn" onClick={toggleTrack} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px 20px', borderRadius: 999,
                  background: isDone ? GREEN : 'rgba(255,255,255,0.06)', border: `1.5px solid ${isDone ? GREEN : 'rgba(255,255,255,0.12)'}`,
                  cursor: 'pointer', transition: 'all 0.3s',
                } as any}>
                  <i className={isDone ? 'ri-check-line' : 'ri-checkbox-blank-circle-line'} style={{ fontSize: 16, color: isDone ? '#FFF' : 'rgba(255,255,255,0.3)' }} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: isDone ? '#FFF' : 'rgba(255,255,255,0.4)' }}>{isDone ? 'Exercice valide' : 'Valider cet exercice'}</span>
                </div>
                </div>
              </div>

              {/* Description / Instructions */}
              {ex.description && (
                <div data-testid="exercise-instructions" style={{ ...C, padding: 16, marginBottom: 12 } as any}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10 }}>
                    <i className="ri-file-list-3-line" style={{ marginRight: 6 }} />Instructions
                  </div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7 }}>{ex.description}</div>
                </div>
              )}

              {/* Intensity info */}
              <div style={{ ...C, padding: 14, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 } as any}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: `${intColor}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                  <i className="ri-shield-check-line" style={{ fontSize: 16, color: intColor }} />
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>{intLabel}. Arretez si vous ressentez une douleur ou un essoufflement important.</div>
              </div>
            </>
          )}
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }` }} />
    </div>
  );
}
