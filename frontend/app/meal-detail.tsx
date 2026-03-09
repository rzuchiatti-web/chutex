import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { BG_IMAGES } from '../src/components/dashboard/constants';

const A = '#F59E0B', G = '#10B981', B = '#60A5FA', R = '#EF4444', P = '#A78BFA';
const GL: any = { borderRadius: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)' };
const IMGS: Record<string, string> = {
  breakfast: 'https://static.prod-images.emergentagent.com/jobs/151f0047-e744-48e3-8d63-62902a0935f7/images/ccd32d626e54c78fac3e5a12346ad156c67fb52d47febfdedc24d0f29e171ac6.png',
  lunch: 'https://static.prod-images.emergentagent.com/jobs/151f0047-e744-48e3-8d63-62902a0935f7/images/528ae850a1d0143524ec5cc75d58c126e9cec798303da7ceb8ac4a1ca68374d8.png',
  snack: 'https://static.prod-images.emergentagent.com/jobs/151f0047-e744-48e3-8d63-62902a0935f7/images/95af5f12498ba3ce4c96135afbe07e314012e9ff8da9410d9e9ac56376d9cb02.png',
  dinner: 'https://static.prod-images.emergentagent.com/jobs/151f0047-e744-48e3-8d63-62902a0935f7/images/3b64345e4d34dc8d5bacd6f55747323e3202d76c19e319a024b7214ca02e9877.png',
};
const COLORS: Record<string, string> = { breakfast: A, lunch: G, snack: P, dinner: B };
const ICONS: Record<string, string> = { breakfast: 'ri-cup-line', lunch: 'ri-restaurant-2-line', snack: 'ri-apple-line', dinner: 'ri-moon-line' };

export default function MealDetailPage() {
  const { token } = useAuth();
  const router = useRouter();
  const { index } = useLocalSearchParams();
  const idx = Number(index ?? 0);
  const [m, setM] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);
  const [allergies, setAllergies] = useState('');

  useEffect(() => { if (!token) return; apiFetch('/api/minceur/weight-details', {}, token).then(d => { const meals = d?.recommendations?.meals || []; if (meals[idx]) setM(meals[idx]); setDone(!!d?.tracking?.completed?.[`meal_${idx}`]); setAllergies(d?.profile?.allergies || ''); }).catch(() => {}).finally(() => setLoading(false)); }, [token, idx]);
  const toggle = async () => { setDone(!done); try { await apiFetch('/api/minceur/track', { method: 'POST', body: JSON.stringify({ type: 'meal', index: idx }) }, token); } catch { setDone(done); } };

  if (Platform.OS !== 'web') return null;
  const tp = m?.type || 'lunch';
  const col = COLORS[tp] || G;
  const macros = m ? [{ l: 'Proteines', v: m.proteines_g, u: 'g', c: G, icon: 'ri-leaf-line' }, { l: 'Glucides', v: m.glucides_g, u: 'g', c: A, icon: 'ri-seedling-line' }, { l: 'Lipides', v: m.lipides_g, u: 'g', c: R, icon: 'ri-drop-line' }] : [];

  return (
    <div data-testid="meal-detail-page" style={{ position: 'absolute', inset: 0, fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' } as any}>
      <img src={BG_IMAGES.beneficiary} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 1 } as any} />
      <div style={{ position: 'relative', zIndex: 5, height: '100%', overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '0 0 120px' } as any}>

          {/* Hero Image with overlay */}
          {!loading && m && (
            <div style={{ position: 'relative', width: '100%', height: 240, overflow: 'hidden' } as any}>
              <img src={IMGS[tp] || IMGS.lunch} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' } as any} />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.7) 100%)' } as any} />
              <div data-testid="back-button" onClick={() => router.back()} style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top, 16px) + 8px)', left: 16, width: 40, height: 40, borderRadius: 12, background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' } as any}><i className="ri-arrow-left-line" style={{ fontSize: 18, color: '#FFF' }} /></div>
              <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20 } as any}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 } as any}>
                  <i className={ICONS[tp] || 'ri-restaurant-2-line'} style={{ fontSize: 13, color: col }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: col, textTransform: 'uppercase', letterSpacing: 1 }}>{m.label} {m.time ? `· ${m.time}` : ''}</span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', lineHeight: 1.2, textShadow: '0 2px 12px rgba(0,0,0,0.5)' }}>{m.name}</div>
              </div>
            </div>
          )}

          <div style={{ padding: '0 20px' } as any}>
            {loading && <div style={{ textAlign: 'center', padding: '120px 0', color: 'rgba(255,255,255,0.3)' }}><div style={{ width: 40, height: 40, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.06)', borderTopColor: A, animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' } as any} /></div>}

            {!loading && m && (
              <>
                {/* Description + Track */}
                <div data-testid="meal-hero" style={{ ...GL, padding: 16, marginTop: -30, marginBottom: 12, position: 'relative', zIndex: 10 } as any}>
                  {m.description && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 12 }}>{m.description}</div>}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as any}>
                    {m.prep_time ? <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.04)' } as any}><i className="ri-timer-line" style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }} /><span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{m.prep_time}</span></div> : <span />}
                    <div data-testid="track-meal-btn" onClick={toggle} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 999, background: done ? G : 'rgba(255,255,255,0.06)', border: `1.5px solid ${done ? G : 'rgba(255,255,255,0.12)'}`, cursor: 'pointer', transition: 'all 0.3s' } as any}>
                      <i className={done ? 'ri-check-line' : 'ri-checkbox-blank-circle-line'} style={{ fontSize: 14, color: done ? '#FFF' : 'rgba(255,255,255,0.3)' }} />
                      <span style={{ fontSize: 11, fontWeight: 800, color: done ? '#FFF' : 'rgba(255,255,255,0.4)' }}>{done ? 'Valide' : 'Valider'}</span>
                    </div>
                  </div>
                </div>

                {/* Nutrition — futuristic */}
                <div data-testid="meal-nutrition" style={{ ...GL, padding: 0, marginBottom: 12, overflow: 'hidden' } as any}>
                  <div style={{ padding: '14px 16px', background: `linear-gradient(135deg, ${col}10, transparent)` } as any}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 } as any}>
                      <span style={{ fontSize: 36, fontWeight: 900, color: '#FFF', lineHeight: 1, letterSpacing: -1 }}>{m.calories}</span>
                      <div><div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.25)' }}>kcal</div><div style={{ fontSize: 8, color: 'rgba(255,255,255,0.15)' }}>ce repas</div></div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', borderTop: '1px solid rgba(255,255,255,0.04)' } as any}>
                    {macros.map((mc, i) => (
                      <div key={i} style={{ flex: 1, padding: '10px 6px', textAlign: 'center', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.03)' : 'none' } as any}>
                        <i className={mc.icon} style={{ fontSize: 14, color: mc.c, display: 'block', marginBottom: 4 }} />
                        <div style={{ fontSize: 17, fontWeight: 900, color: '#FFF' }}>{mc.v || '—'}<span style={{ fontSize: 8, color: 'rgba(255,255,255,0.15)' }}>{mc.u}</span></div>
                        <div style={{ fontSize: 7, color: mc.c, fontWeight: 700, textTransform: 'uppercase', marginTop: 2 }}>{mc.l}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Ingredients — visual cards */}
                {m.ingredients?.length > 0 && (
                  <div data-testid="meal-ingredients" style={{ ...GL, padding: 16, marginBottom: 12 } as any}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 } as any}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}>
                        <i className="ri-shopping-basket-2-line" style={{ fontSize: 14, color: col }} />
                        <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1 }}>Ingredients</span>
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.15)' }}>{m.ingredients.length} items</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 } as any}>
                      {m.ingredients.map((ing: any, i: number) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '8px 10px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)', animation: `fadeSlide 0.3s ${i * 0.05}s ease both` } as any}>
                          <div style={{ width: 28, height: 28, borderRadius: 8, background: `${col}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 10 } as any}>
                            <i className="ri-checkbox-blank-circle-fill" style={{ fontSize: 6, color: col }} />
                          </div>
                          <div style={{ flex: 1 } as any}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#FFF' }}>{ing.name}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
                            <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{ing.quantity}</span>
                            {ing.calories > 0 && <span style={{ padding: '2px 6px', borderRadius: 6, background: 'rgba(255,255,255,0.04)', fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)' }}>{ing.calories}kcal</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recipe — step cards */}
                {m.recipe?.length > 0 && (
                  <div data-testid="meal-recipe" style={{ ...GL, padding: 16, marginBottom: 12 } as any}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 } as any}>
                      <i className="ri-file-list-3-line" style={{ fontSize: 14, color: col }} />
                      <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1 }}>Preparation</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 } as any}>
                      {m.recipe.map((step: string, i: number) => (
                        <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 12px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.04)', animation: `fadeSlide 0.3s ${i * 0.08}s ease both` } as any}>
                          <div style={{ width: 28, height: 28, borderRadius: 10, background: `${col}12`, border: `1px solid ${col}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 900, color: col } as any}>{i + 1}</div>
                          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, flex: 1, paddingTop: 4 }}>{step}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Allergy note */}
                {allergies && allergies.toLowerCase() !== 'aucune' && allergies !== '' && (
                  <div style={{ padding: '8px 12px', borderRadius: 12, background: `${A}06`, border: `1px solid ${A}10`, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 } as any}>
                    <i className="ri-shield-check-line" style={{ fontSize: 13, color: A, flexShrink: 0 }} />
                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Adapte a vos allergies ({allergies})</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}@keyframes fadeSlide{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}` }} />
    </div>
  );
}
