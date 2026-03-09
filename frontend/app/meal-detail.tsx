import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { BG_IMAGES } from '../src/components/dashboard/constants';

const ACCENT = '#F59E0B';
const GREEN = '#10B981';
const BLUE = '#60A5FA';
const CARD: any = {
  borderRadius: 20, background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.08)',
  backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
};
const TYPE_META: Record<string, { icon: string; color: string; bg: string }> = {
  breakfast: { icon: 'ri-cup-line', color: '#F59E0B', bg: 'linear-gradient(135deg, #F59E0B18, #F59E0B05)' },
  lunch: { icon: 'ri-restaurant-2-line', color: '#10B981', bg: 'linear-gradient(135deg, #10B98118, #10B98105)' },
  snack: { icon: 'ri-apple-line', color: '#A78BFA', bg: 'linear-gradient(135deg, #A78BFA18, #A78BFA05)' },
  dinner: { icon: 'ri-moon-line', color: '#60A5FA', bg: 'linear-gradient(135deg, #60A5FA18, #60A5FA05)' },
};

export default function MealDetailPage() {
  const { token } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const mealIndex = Number(params.index ?? 0);
  const [meal, setMeal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if (!token) return;
    apiFetch('/api/minceur/weight-details', {}, token).then(d => {
      const meals = d?.recommendations?.meals || [];
      if (meals[mealIndex]) setMeal(meals[mealIndex]);
      const completed = d?.tracking?.completed || {};
      setIsDone(!!completed[`meal_${mealIndex}`]);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [token, mealIndex]);

  const toggleTrack = async () => {
    setIsDone(!isDone);
    try {
      await apiFetch('/api/minceur/track', {
        method: 'POST', body: JSON.stringify({ type: 'meal', index: mealIndex }),
      }, token);
    } catch { setIsDone(isDone); }
  };

  if (Platform.OS !== 'web') return null;
  const m = meal;
  const meta = TYPE_META[m?.type] || TYPE_META.lunch;
  const macros = m ? [
    { label: 'Proteines', val: m.proteines_g, unit: 'g', color: GREEN },
    { label: 'Glucides', val: m.glucides_g, unit: 'g', color: ACCENT },
    { label: 'Lipides', val: m.lipides_g, unit: 'g', color: '#EF4444' },
  ] : [];

  return (
    <div data-testid="meal-detail-page" style={{ position: 'absolute', inset: 0, fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' } as any}>
      <img src={BG_IMAGES.beneficiary} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1 } as any} />

      <div style={{ position: 'relative', zIndex: 5, height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: 'calc(env(safe-area-inset-top, 20px) + 12px) 20px 120px' } as any}>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 } as any}>
            <div data-testid="back-button" onClick={() => router.back()} style={{
              width: 44, height: 44, borderRadius: 14,
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            } as any}>
              <i className="ri-arrow-left-line" style={{ fontSize: 18, color: '#FFF' }} />
            </div>
            <div style={{ flex: 1 } as any}>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF' }}>Detail du repas</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Recette et nutrition</div>
            </div>
          </div>

          {loading && (
            <div style={{ textAlign: 'center', padding: 60, color: 'rgba(255,255,255,0.3)' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.06)', borderTopColor: ACCENT, animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' } as any} />
              Chargement...
            </div>
          )}

          {!loading && !m && (
            <div style={{ ...CARD, padding: 32, textAlign: 'center' } as any}>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }}>Repas introuvable</div>
            </div>
          )}

          {!loading && m && (
            <>
              {/* Meal Hero */}
              <div data-testid="meal-hero" style={{ ...CARD, padding: 20, marginBottom: 12, background: meta.bg } as any}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 } as any}>
                  <div style={{ width: 52, height: 52, borderRadius: 16, background: `${meta.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                    <i className={meta.icon} style={{ fontSize: 24, color: meta.color }} />
                  </div>
                  <div style={{ flex: 1 } as any}>
                    <div style={{ fontSize: 9, fontWeight: 700, color: meta.color, textTransform: 'uppercase', letterSpacing: 1 }}>{m.label} {m.time ? `· ${m.time}` : ''}</div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF', lineHeight: 1.2 }}>{m.name}</div>
                  </div>
                </div>
                {m.description && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 14 }}>{m.description}</div>}

                {/* Prep time + Track button */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as any}>
                  {m.prep_time && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}>
                      <i className="ri-timer-line" style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }} />
                      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Preparation: {m.prep_time}</span>
                    </div>
                  )}
                  <div data-testid="track-meal-btn" onClick={toggleTrack} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 999,
                    background: isDone ? GREEN : 'rgba(255,255,255,0.06)',
                    border: `1.5px solid ${isDone ? GREEN : 'rgba(255,255,255,0.12)'}`,
                    cursor: 'pointer', transition: 'all 0.3s',
                  } as any}>
                    <i className={isDone ? 'ri-check-line' : 'ri-checkbox-blank-circle-line'} style={{ fontSize: 16, color: isDone ? '#FFF' : 'rgba(255,255,255,0.3)' }} />
                    <span style={{ fontSize: 12, fontWeight: 800, color: isDone ? '#FFF' : 'rgba(255,255,255,0.4)' }}>{isDone ? 'Valide' : 'Valider ce repas'}</span>
                  </div>
                </div>
              </div>

              {/* Nutrition */}
              <div data-testid="meal-nutrition" style={{ ...CARD, padding: 16, marginBottom: 12 } as any}>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12 }}>Valeurs nutritionnelles</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 } as any}>
                  <div style={{ textAlign: 'center' } as any}>
                    <div style={{ fontSize: 40, fontWeight: 900, color: '#FFF', lineHeight: 1 }}>{m.calories}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', fontWeight: 700 }}>kcal</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 } as any}>
                  {macros.map((mc, i) => (
                    <div key={i} style={{ flex: 1, padding: '10px 6px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', textAlign: 'center' } as any}>
                      <div style={{ width: '100%', height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.04)', marginBottom: 8, overflow: 'hidden' } as any}>
                        <div style={{ height: '100%', borderRadius: 2, width: `${Math.min(100, ((mc.val || 0) / (mc.label === 'Proteines' ? 40 : mc.label === 'Glucides' ? 80 : 30)) * 100)}%`, background: mc.color, transition: 'width 1s ease' } as any} />
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF' }}>{mc.val || '—'}<span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)' }}>{mc.unit}</span></div>
                      <div style={{ fontSize: 8, color: mc.color, fontWeight: 700, marginTop: 2 }}>{mc.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Ingredients */}
              {m.ingredients && m.ingredients.length > 0 && (
                <div data-testid="meal-ingredients" style={{ ...CARD, padding: 16, marginBottom: 12 } as any}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12 }}>
                    <i className="ri-shopping-basket-2-line" style={{ marginRight: 6 }} />
                    Ingredients ({m.ingredients.length})
                  </div>
                  {m.ingredients.map((ing: any, i: number) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 0',
                      borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    } as any}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 } as any}>
                        <div style={{ width: 6, height: 6, borderRadius: '50%', background: meta.color, flexShrink: 0, opacity: 0.6 } as any} />
                        <span style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{ing.name}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 } as any}>
                        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 600 }}>{ing.quantity}</span>
                        {ing.calories > 0 && <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', fontWeight: 700 }}>{ing.calories}kcal</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Recipe Steps */}
              {m.recipe && m.recipe.length > 0 && (
                <div data-testid="meal-recipe" style={{ ...CARD, padding: 16, marginBottom: 12 } as any}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12 }}>
                    <i className="ri-file-list-3-line" style={{ marginRight: 6 }} />
                    Preparation
                  </div>
                  {m.recipe.map((step: string, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' } as any}>
                      <div style={{
                        width: 26, height: 26, borderRadius: 8, flexShrink: 0,
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 900, color: meta.color,
                      } as any}>{i + 1}</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, flex: 1 }}>{step}</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }` }} />
    </div>
  );
}
