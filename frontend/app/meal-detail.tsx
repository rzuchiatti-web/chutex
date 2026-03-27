import React, { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';

const BG = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/v5t9l2mb_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_10_07.png';
const MEAL_LABELS: Record<string, string> = { petit_dejeuner: 'Petit-dejeuner', dejeuner: 'Dejeuner', collation: 'Collation', gouter: 'Gouter', diner: 'Diner' };
const MEAL_ICONS: Record<string, string> = { petit_dejeuner: 'ri-sun-line', dejeuner: 'ri-restaurant-line', collation: 'ri-cake-2-line', gouter: 'ri-cup-line', diner: 'ri-moon-line' };
const MEAL_COLORS: Record<string, string> = { petit_dejeuner: '#F59E0B', dejeuner: '#10B981', collation: '#A78BFA', gouter: '#A78BFA', diner: '#60A5FA' };

const FOOD_E: Record<string, string> = { oeuf: '🥚', lait: '🥛', yaourt: '🥛', fromage: '🧀', beurre: '🧈', huile: '🫒', poulet: '🍗', poisson: '🐟', saumon: '🐟', cabillaud: '🐟', viande: '🥩', steak: '🥩', riz: '🍚', quinoa: '🌾', pate: '🍝', pain: '🍞', avoine: '🌾', flocon: '🌾', lentille: '🫘', pomme: '🍎', fruit: '🍇', banane: '🍌', kiwi: '🥝', orange: '🍊', tomate: '🍅', legume: '🥬', salade: '🥗', epinard: '🥬', brocoli: '🥦', carotte: '🥕', courgette: '🥒', oignon: '🧅', ail: '🧄', amande: '🥜', noix: '🥜', graine: '🌰', miel: '🍯', citron: '🍋', eau: '💧', chia: '🌰', patate: '🥔', olive: '🫒', poivron: '🫑', champignon: '🍄', avocat: '🥑', concombre: '🥒', chou: '🥬', persil: '🌿', herbe: '🌿', chocolat: '🍫', cafe: '☕', the: '🍵', myrtille: '🫐', fraise: '🍓', framboise: '🍓', mangue: '🥭', acai: '🫐', granola: '🥣', whey: '🥤', cacahuete: '🥜', coco: '🥥', sesame: '🌰', soja: '🫘', edamame: '🫛' };
function foodEmoji(name: string): string { const n = name.toLowerCase(); for (const [k, v] of Object.entries(FOOD_E)) { if (n.includes(k)) return v; } return '🍽️'; }

const STEP_ICONS: { keywords: string[]; icon: string; color: string }[] = [
  { keywords: ['couper', 'tranch', 'decoup', 'eminc', 'hach'], icon: 'ri-scissors-line', color: '#EF4444' },
  { keywords: ['melang', 'remuer', 'battre', 'fouett', 'incorpor'], icon: 'ri-refresh-line', color: '#A78BFA' },
  { keywords: ['cuire', 'chauffe', 'revenir', 'sauter', 'griller', 'dorer', 'saisir', 'poele'], icon: 'ri-fire-line', color: '#F59E0B' },
  { keywords: ['four', 'prechauff', 'enfourne'], icon: 'ri-temp-hot-line', color: '#EF4444' },
  { keywords: ['verser', 'ajoute', 'depose', 'nappe'], icon: 'ri-add-circle-line', color: '#38BDF8' },
  { keywords: ['servir', 'dresser', 'dispose', 'garni'], icon: 'ri-restaurant-line', color: '#10B981' },
  { keywords: ['repos', 'refroidi', 'laisser', 'mariner'], icon: 'ri-time-line', color: '#A78BFA' },
  { keywords: ['assaisonn', 'saler', 'poivrer'], icon: 'ri-sparkling-line', color: '#F59E0B' },
  { keywords: ['peler', 'epluche', 'laver', 'rincer'], icon: 'ri-drop-line', color: '#38BDF8' },
  { keywords: ['mixer', 'broyer', 'ecraser'], icon: 'ri-blender-line', color: '#A78BFA' },
  { keywords: ['bouilli', 'eau', 'vapeur'], icon: 'ri-water-flash-line', color: '#38BDF8' },
];
function stepIcon(text: string): { icon: string; color: string } {
  const t = text.toLowerCase();
  for (const s of STEP_ICONS) { if (s.keywords.some(k => t.includes(k))) return { icon: s.icon, color: s.color }; }
  return { icon: 'ri-knife-line', color: '#9CA3AF' };
}

export default function MealDetailPage() {
  const { token } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { index, id, mode, assignmentId } = params as any;
  const idx = Number(index ?? 0);
  const [m, setM] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) return;
    if (mode === 'assigned' && assignmentId) {
      apiFetch(`/api/pro/assigned-meal-detail/${assignmentId}`, {}, token)
        .then(d => { if (d) setM(d); }).catch(() => {}).finally(() => setLoading(false));
    } else if (mode === 'template' && id) {
      apiFetch(`/api/pro/meal-template-detail/${id}`, {}, token)
        .then(d => { if (d) setM(d); }).catch(() => {}).finally(() => setLoading(false));
    } else {
      apiFetch('/api/minceur/weight-details', {}, token)
        .then(d => { const meals = d?.recommendations?.meals || []; if (meals[idx]) setM(meals[idx]); setDone(!!d?.tracking?.completed?.[`meal_${idx}`]); })
        .catch(() => {}).finally(() => setLoading(false));
    }
  }, [token, idx, id, mode, assignmentId]);

  const toggle = async () => { setDone(!done); try { await apiFetch('/api/minceur/track', { method: 'POST', body: JSON.stringify({ type: 'meal', index: idx }) }, token); } catch { setDone(done); } };

  if (Platform.OS !== 'web') return null;

  const mt = m?.meal_type || 'dejeuner';
  const col = MEAL_COLORS[mt] || '#10B981';
  const icon = MEAL_ICONS[mt] || 'ri-restaurant-line';
  const label = MEAL_LABELS[mt] || mt.replace('_', ' ');
  const ingredients = m?.ingredients || [];
  const steps = m?.steps || m?.recipe || [];

  return (
    <div data-testid="meal-detail-page" style={{ position: 'absolute', inset: 0, background: '#F5F5F5', fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden', display: 'flex', flexDirection: 'column' } as any}>
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>

        {/* HEADER */}
        <div style={{ position: 'relative', zIndex: 1, minHeight: 200 } as any}>
          {(() => {
            const headerImg = m?.image ? (m.image.startsWith('/') ? `${process.env.EXPO_PUBLIC_BACKEND_URL || ''}${m.image}` : m.image) : BG;
            return <img key={headerImg} src={headerImg} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' } as any} />;
          })()}
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: m?.image ? 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.65) 100%)' : 'none' } as any} />
          <div style={{ position: 'relative', zIndex: 2, padding: '28px 20px 32px' } as any}>
            <div data-testid="back-button" onClick={() => router.back()} style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.15)', marginBottom: 16 } as any}>
              <i className="ri-arrow-left-line" style={{ fontSize: 18, color: '#FFF' }} />
            </div>

            {!loading && m && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' } as any}>
                <div style={{ width: 56, height: 56, borderRadius: 18, background: `${col}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, border: `2px solid ${col}50` } as any}>
                  <i className={icon} style={{ fontSize: 26, color: '#FFF' }} />
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: col, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', textAlign: 'center', textTransform: 'capitalize' }}>{m.title || m.name}</div>
              </div>
            )}
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ padding: '20px 16px 120px', marginTop: -16, borderRadius: '24px 24px 0 0', background: '#FFF', position: 'relative', zIndex: 10, minHeight: 'calc(100vh - 240px)' } as any}>

          {loading && <div style={{ textAlign: 'center', padding: '60px 0', color: '#9CA3AF' }}><i className="ri-loader-4-line" style={{ fontSize: 28, animation: 'spin 0.8s linear infinite', display: 'block', marginBottom: 8 }} />Chargement...</div>}

          {!loading && m && (
            <>
              {/* Nutrition card */}
              <div data-testid="meal-nutrition" style={{ borderRadius: 16, background: '#F4F4F5', padding: '16px 18px', marginBottom: 14 } as any}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 } as any}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}>
                    <i className="ri-fire-line" style={{ fontSize: 14, color: col }} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>Valeurs nutritionnelles</span>
                  </div>
                  {!mode && <div data-testid="track-meal-placeholder" />}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 12 } as any}>
                  <span style={{ fontSize: 32, fontWeight: 900, color: '#111', letterSpacing: -1 }}>{m.calories || 0}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF' }}>kcal</span>
                </div>
                <div style={{ height: 1, background: '#E5E7EB', marginBottom: 12 } as any} />
                <div style={{ display: 'flex', alignItems: 'center' } as any}>
                  {[
                    { label: 'Proteines', val: m.proteins || m.proteines || m.proteines_g || 0, color: '#10B981' },
                    { label: 'Glucides', val: m.glucides || m.glucides_g || 0, color: '#F59E0B' },
                    { label: 'Lipides', val: m.lipides || m.lipides_g || 0, color: '#EF4444' },
                  ].map((mc, i) => (
                    <React.Fragment key={mc.label}>
                      {i > 0 && <div style={{ width: 1, height: 28, background: '#E5E7EB' } as any} />}
                      <div style={{ flex: 1, textAlign: 'center' } as any}>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#111' }}>{mc.val}<span style={{ fontSize: 10, color: '#9CA3AF' }}>g</span></div>
                        <div style={{ fontSize: 9, fontWeight: 600, color: mc.color, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>{mc.label}</div>
                      </div>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Notes */}
              {m.notes && (
                <div style={{ borderRadius: 16, background: '#F4F4F5', padding: '12px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 } as any}>
                  <i className="ri-lightbulb-line" style={{ fontSize: 16, color: '#F59E0B', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5 }}>{m.notes}</span>
                </div>
              )}

              {/* Ingredients */}
              {ingredients.length > 0 && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, marginTop: 6 } as any}>
                    <i className="ri-shopping-basket-2-line" style={{ fontSize: 16, color: col }} />
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#111' }}>Ingredients</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', background: '#E5E7EB', padding: '2px 8px', borderRadius: 999 }}>{ingredients.length}</span>
                  </div>
                  {ingredients.map((ing: any, i: number) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 14, background: '#F4F4F5', marginBottom: 6 } as any}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 } as any}>
                        {foodEmoji(ing.name)}
                      </div>
                      <div style={{ flex: 1 } as any}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{ing.name}</div>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#9CA3AF' }}>{ing.quantity}{ing.unit || ''}</span>
                    </div>
                  ))}
                </>
              )}

              {/* Steps */}
              {steps.length > 0 && (
                <>
                  <div style={{ height: 1, background: '#E5E7EB', margin: '14px 0' } as any} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 } as any}>
                    <i className="ri-file-list-3-line" style={{ fontSize: 16, color: col }} />
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#111' }}>Preparation</span>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', background: '#E5E7EB', padding: '2px 8px', borderRadius: 999 }}>{steps.length} etapes</span>
                  </div>
                  {steps.map((step: string, i: number) => (
                      <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 14px', borderRadius: 14, background: '#F4F4F5', marginBottom: 6 } as any}>
                        <span style={{ fontSize: 18, fontWeight: 900, color: '#111', flexShrink: 0, minWidth: 24 }}>{i + 1}.</span>
                        <div style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.6, flex: 1, paddingTop: 3 }}>{step}</div>
                      </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Fixed green validate button at bottom */}
      {!loading && m && !mode && (
        <div data-testid="track-meal-btn" onClick={toggle} style={{
          position: 'sticky', bottom: 0, left: 0, right: 0, padding: '12px 16px 28px',
          background: 'linear-gradient(0deg, #FFF 60%, transparent)', zIndex: 20,
        } as any}>
          <div style={{
            width: '100%', padding: '16px', borderRadius: 16,
            background: done ? '#10B981' : '#111',
            textAlign: 'center', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
          } as any}>
            <i className={done ? 'ri-checkbox-circle-fill' : 'ri-check-line'} style={{ fontSize: 18, color: '#FFF' }} />
            <span style={{ fontSize: 15, fontWeight: 800, color: '#FFF' }}>{done ? 'Repas valide !' : 'Valider ce repas'}</span>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}` }} />
    </div>
  );
}
