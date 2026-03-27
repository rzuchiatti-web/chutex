import React from 'react';
import { API, MEAL_IMGS, toLocalDateStr } from './constants';
import { REMINDER_IMAGES } from '../constants';

const MEAL_ICONS: Record<string, string> = {
  petit_dejeuner: 'ri-sun-line',
  dejeuner: 'ri-restaurant-line',
  collation: 'ri-cake-2-line',
  gouter: 'ri-cup-line',
  diner: 'ri-moon-line',
};

interface ProDayViewProps {
  filteredExercises: any[];
  filteredReminders: any[];
  filteredMeals: any[];
  selectedDayFr: string;
  selectedDateStr: string;
  AC: string;
  router: any;
  onAddExercise: () => void;
  onAddReminder: () => void;
  onAddMeal: () => void;
  onAddHydration: () => void;
  onEditExercise: (ex: any) => void;
  onEditReminder: (r: any) => void;
  onEditMeal: (m: any) => void;
  onDeleteExercise: (id: string) => void;
  onDeleteReminder: (id: string) => void;
  onDeleteMeal: (id: string) => void;
  benNutrition: any;
  benWeightGoal: any;
  activeBenId: string;
}

export function ProDayView(props: ProDayViewProps) {
  const { filteredExercises, filteredReminders, filteredMeals, selectedDayFr, selectedDateStr, AC, router, benNutrition, benWeightGoal, activeBenId } = props;

  return (
    <>
      {/* Nutrition + Weight Goal Combined Card — Dark style */}
      {(benNutrition?.daily_calories > 0 || (benWeightGoal && benWeightGoal.has_goal)) && (
        <div data-testid="nutrition-weight-card" onClick={() => router.push({ pathname: '/minceur' as any, params: { beneficiaryId: activeBenId } })}
          style={{ borderRadius: 20, background: 'linear-gradient(145deg, #0F172A 0%, #1E293B 100%)', padding: '20px 18px', marginBottom: 18, cursor: 'pointer', position: 'relative', overflow: 'hidden' } as any}>

          {/* Subtle glow */}
          <div style={{ position: 'absolute', top: -40, right: -40, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)' } as any} />

          {/* Header + arrow */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 } as any}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1.5 }}>Consommation par jour</div>
            <i className="ri-arrow-right-s-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.3)' }} />
          </div>

          {benNutrition && benNutrition.daily_calories > 0 && (
            <>
              {/* Kcal + Water row */}
              <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 16 } as any}>
                <div>
                  <span style={{ fontSize: 42, fontWeight: 900, color: '#FFF', letterSpacing: -2, lineHeight: 1 }}>{benNutrition.daily_calories}</span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'rgba(255,255,255,0.4)', marginLeft: 4 }}>kcal</span>
                </div>
                <div style={{ padding: '10px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 6 } as any}>
                  <i className="ri-drop-fill" style={{ fontSize: 16, color: '#60A5FA' }} />
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#60A5FA' }}>{benNutrition.water_ml >= 1000 ? `${(benNutrition.water_ml / 1000).toFixed(1)}L` : `${benNutrition.water_ml}ml`}</span>
                </div>
              </div>

              {/* Macros row */}
              <div style={{ display: 'flex', gap: 8 } as any}>
                {[
                  { label: 'PROTEINES', val: benNutrition.macros?.proteines_g || 0, color: '#10B981' },
                  { label: 'GLUCIDES', val: benNutrition.macros?.glucides_g || 0, color: '#F59E0B' },
                  { label: 'LIPIDES', val: benNutrition.macros?.lipides_g || 0, color: '#EF4444' },
                ].map((m) => (
                  <div key={m.label} style={{ flex: 1, padding: '12px 8px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' } as any}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', lineHeight: 1 }}>{m.val}<span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.3)' }}>g</span></div>
                    <div style={{ fontSize: 8, fontWeight: 700, color: m.color, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 4 }}>{m.label}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Weight Goal section */}
          {benWeightGoal && benWeightGoal.has_goal && (
            <>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '16px 0' } as any} />
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 } as any}>
                <i className="ri-scales-3-line" style={{ fontSize: 14, color: '#A78BFA' }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: '#A78BFA' }}>Objectif poids</span>
                {benWeightGoal.weeks > 0 && <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginLeft: 'auto' }}>{benWeightGoal.weeks} semaines</span>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 } as any}>
                <div style={{ textAlign: 'center' } as any}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>{benWeightGoal.current_kg}<span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>kg</span></div>
                  <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', fontWeight: 600, textTransform: 'uppercase', marginTop: 2 }}>Actuel</div>
                </div>
                <div style={{ flex: 1 } as any}>
                  <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' } as any}>
                    <div style={{ height: '100%', borderRadius: 3, background: 'linear-gradient(90deg, #7C3AED, #A78BFA)', width: `${Math.min(100, benWeightGoal.progress_pct || 0)}%` } as any} />
                  </div>
                  <div style={{ textAlign: 'center', marginTop: 4 } as any}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#A78BFA' }}>{Math.round(benWeightGoal.progress_pct || 0)}%</span>
                  </div>
                </div>
                <div style={{ textAlign: 'center' } as any}>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#A78BFA' }}>{benWeightGoal.target_kg}<span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>kg</span></div>
                  <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', fontWeight: 600, textTransform: 'uppercase', marginTop: 2 }}>Objectif</div>
                </div>
              </div>
              {benWeightGoal.current_kg > 0 && benWeightGoal.target_kg > 0 && (
                <div style={{ textAlign: 'center', fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 8 }}>
                  {benWeightGoal.current_kg > benWeightGoal.target_kg
                    ? `Encore ${(benWeightGoal.current_kg - benWeightGoal.target_kg).toFixed(1)} kg a perdre`
                    : benWeightGoal.current_kg < benWeightGoal.target_kg
                    ? `Encore ${(benWeightGoal.target_kg - benWeightGoal.current_kg).toFixed(1)} kg a prendre`
                    : 'Objectif atteint !'
                  }
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Exercices du jour */}
      <div style={{ height: 1, background: '#E5E7EB', margin: '4px 0 18px' } as any} />
      <SectionHeader icon="ri-calendar-check-line" iconColor={AC} title={`Exercices du ${selectedDayFr}`} count={filteredExercises.length} onAdd={props.onAddExercise} testId="cat-add-exercices" />
      {filteredExercises.length === 0 && <EmptyDay icon="ri-inbox-2-line" text={`Aucun exercice prevu le ${selectedDayFr}`} />}
      {filteredExercises.map(ex => {
        const done = (ex.completions || []).some((c: any) => c.date?.startsWith(selectedDateStr) && c.status === 'done');
        const partial = (ex.completions || []).some((c: any) => c.date?.startsWith(selectedDateStr) && c.status === 'partial');
        return (
          <div key={ex.id} data-testid={`day-exercise-${ex.id}`}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 16,
              background: done ? 'rgba(16,185,129,0.06)' : partial ? 'rgba(245,158,11,0.06)' : '#F4F4F5',
              border: done ? '1px solid rgba(16,185,129,0.2)' : partial ? '1px solid rgba(245,158,11,0.2)' : '1px solid transparent',
              marginBottom: 8, transition: 'all 0.15s' } as any}>
            <div onClick={() => router.push({ pathname: '/pro-exercise-detail' as any, params: { id: ex.exercise_template_id || ex.id, mode: 'assigned', assignmentId: ex.id } })}
              style={{ width: 48, height: 48, borderRadius: 12, overflow: 'hidden', flexShrink: 0, cursor: 'pointer', background: `${AC}10`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
              <i className={ex.icon || 'ri-run-line'} style={{ fontSize: 22, color: AC }} />
            </div>
            <div onClick={() => router.push({ pathname: '/pro-exercise-detail' as any, params: { id: ex.exercise_template_id || ex.id, mode: 'assigned', assignmentId: ex.id } })}
              style={{ flex: 1, minWidth: 0, cursor: 'pointer' } as any}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111', textTransform: 'capitalize' }}>{ex.title}</div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{ex.sets}x{ex.repetitions} - {ex.rest_seconds}s repos</div>
            </div>
            <StatusBadge done={done} partial={partial} testPrefix={`exercise-status-${ex.id}`} />
            <ActionButtons onEdit={() => props.onEditExercise(ex)} onDelete={() => props.onDeleteExercise(ex.id)} testPrefix={`exercise-${ex.id}`} />
          </div>
        );
      })}

      {/* Traitements du jour (non-hydratation) */}
      <div style={{ height: 1, background: '#E5E7EB', margin: '12px 0 18px' } as any} />
      <SectionHeader icon="ri-capsule-line" iconColor="#F59E0B" title={`Traitements du ${selectedDayFr}`} count={filteredReminders.filter(r => r.reminder_type !== 'hydration').length} onAdd={props.onAddReminder} testId="cat-add-rappels" />
      {filteredReminders.filter(r => r.reminder_type !== 'hydration').length === 0 && <EmptyDay icon="ri-capsule-line" text={`Aucun complement prevu le ${selectedDayFr}`} />}
      {filteredReminders.filter(r => r.reminder_type !== 'hydration').map(r => {
        const remImg = r.image || REMINDER_IMAGES.medication;
        const remDone = (r.completions || []).some((c: any) => c.date?.startsWith(selectedDateStr) && c.status === 'done');
        return (
          <div key={r.id} data-testid={`day-reminder-${r.id}`}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 16,
              background: remDone ? 'rgba(16,185,129,0.06)' : '#F4F4F5',
              border: remDone ? '1px solid rgba(16,185,129,0.2)' : '1px solid transparent',
              marginBottom: 8, transition: 'all 0.15s' } as any}>
            <div style={{ width: 48, height: 48, borderRadius: 12, overflow: 'hidden', flexShrink: 0 } as any}>
              <img src={remImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' } as any} />
            </div>
            <div style={{ flex: 1, minWidth: 0 } as any}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111', textTransform: 'capitalize' }}>{r.title}</div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{r.dosage} - {r.time}</div>
            </div>
            <StatusBadge done={remDone} testPrefix={`reminder-status-${r.id}`} />
            <ActionButtons onEdit={() => props.onEditReminder(r)} onDelete={() => props.onDeleteReminder(r.id)} testPrefix={`reminder-${r.id}`} />
          </div>
        );
      })}

      {/* Hydratation du jour */}
      <div style={{ height: 1, background: '#E5E7EB', margin: '12px 0 18px' } as any} />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 } as any}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
          <div style={{ width: 28, height: 28, borderRadius: 8, overflow: 'hidden', flexShrink: 0 } as any}>
            <img src={REMINDER_IMAGES.hydration} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' } as any} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#111' }}>Hydratation du {selectedDayFr}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', background: '#E5E7EB', padding: '2px 8px', borderRadius: 999 }}>{filteredReminders.filter(r => r.reminder_type === 'hydration').length}</span>
        </div>
        <div data-testid="cat-add-hydratation" onClick={props.onAddHydration}
          style={{ width: 34, height: 34, borderRadius: 999, background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' } as any}>
          <i className="ri-add-line" style={{ fontSize: 18, color: '#374151' }} />
        </div>
      </div>
      {filteredReminders.filter(r => r.reminder_type === 'hydration').length === 0 && <EmptyDay icon="ri-drop-line" text={`Aucun rappel hydratation le ${selectedDayFr}`} />}
      {filteredReminders.filter(r => r.reminder_type === 'hydration').map(r => {
        const remImg = r.image || REMINDER_IMAGES.hydration;
        const remDone = (r.completions || []).some((c: any) => c.date?.startsWith(selectedDateStr) && c.status === 'done');
        return (
          <div key={r.id} data-testid={`day-hydration-${r.id}`}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 16,
              background: remDone ? 'rgba(16,185,129,0.06)' : '#F4F4F5',
              border: remDone ? '1px solid rgba(16,185,129,0.2)' : '1px solid transparent',
              marginBottom: 8, transition: 'all 0.15s' } as any}>
            <div style={{ width: 48, height: 48, borderRadius: 12, overflow: 'hidden', flexShrink: 0 } as any}>
              <img src={remImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' } as any} />
            </div>
            <div style={{ flex: 1, minWidth: 0 } as any}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111', textTransform: 'capitalize' }}>{r.title}</div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{r.dosage} - {r.time}</div>
            </div>
            <StatusBadge done={remDone} />
            <ActionButtons onEdit={() => props.onEditReminder(r)} onDelete={() => props.onDeleteReminder(r.id)} />
          </div>
        );
      })}

      {/* Repas du jour */}
      <div style={{ height: 1, background: '#E5E7EB', margin: '12px 0 18px' } as any} />
      <SectionHeader icon="ri-restaurant-line" iconColor="#10B981" title={`Repas du ${selectedDayFr}`} count={filteredMeals.length} onAdd={props.onAddMeal} testId="cat-add-repas" />
      {filteredMeals.length === 0 && <EmptyDay icon="ri-restaurant-line" text={`Aucun repas prevu le ${selectedDayFr}`} />}
      {filteredMeals.map(m => {
        const mealDone = (m.completions || []).some((c: any) => c.date?.startsWith(selectedDateStr) && c.status === 'done');
        const mealIcon = MEAL_ICONS[m.meal_type] || 'ri-restaurant-line';
        return (
          <div key={m.id} data-testid={`day-meal-${m.id}`}
            style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 16,
              background: mealDone ? 'rgba(16,185,129,0.06)' : '#F4F4F5',
              border: mealDone ? '1px solid rgba(16,185,129,0.2)' : '1px solid transparent',
              marginBottom: 8, transition: 'all 0.15s' } as any}>
            <div onClick={() => router.push({ pathname: '/meal-detail' as any, params: { id: m.meal_template_id || m.id, mode: 'assigned', assignmentId: m.id } })}
              style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, cursor: 'pointer', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
              <i className={mealIcon} style={{ fontSize: 22, color: '#10B981' }} />
            </div>
            <div onClick={() => router.push({ pathname: '/meal-detail' as any, params: { id: m.meal_template_id || m.id, mode: 'assigned', assignmentId: m.id } })}
              style={{ flex: 1, minWidth: 0, cursor: 'pointer' } as any}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#111', textTransform: 'capitalize' }}>{m.title}</div>
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2 }}>{m.meal_type?.replace('_', ' ')} {m.calories ? `- ${m.calories} kcal` : ''}</div>
            </div>
            <StatusBadge done={mealDone} testPrefix={`meal-status-${m.id}`} />
            <ActionButtons onEdit={() => props.onEditMeal(m)} onDelete={() => props.onDeleteMeal(m.id)} testPrefix={`meal-${m.id}`} />
          </div>
        );
      })}
    </>
  );
}

/* ── Small helpers ── */

function SectionHeader({ icon, iconColor, title, count, onAdd, testId, style }: { icon: string; iconColor: string; title: string; count: number; onAdd: () => void; testId?: string; style?: any }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, ...style } as any}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
        <i className={icon} style={{ fontSize: 16, color: iconColor }} />
        <span style={{ fontSize: 14, fontWeight: 800, color: '#111' }}>{title}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#9CA3AF', background: '#E5E7EB', padding: '2px 8px', borderRadius: 999 }}>{count}</span>
      </div>
      <div data-testid={testId} onClick={onAdd}
        style={{ width: 34, height: 34, borderRadius: 999, background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' } as any}>
        <i className="ri-add-line" style={{ fontSize: 18, color: '#374151' }} />
      </div>
    </div>
  );
}

function StatusBadge({ done, partial, testPrefix }: { done: boolean; partial?: boolean; testPrefix?: string }) {
  if (done) return (
    <div data-testid={testPrefix ? `${testPrefix}-done` : undefined} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, background: 'rgba(16,185,129,0.1)' } as any}>
      <i className="ri-checkbox-circle-fill" style={{ fontSize: 16, color: '#10B981' }} />
      <span style={{ fontSize: 11, fontWeight: 700, color: '#10B981' }}>Fait</span>
    </div>
  );
  if (partial) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, background: 'rgba(245,158,11,0.1)' } as any}>
      <i className="ri-indeterminate-circle-line" style={{ fontSize: 16, color: '#F59E0B' }} />
      <span style={{ fontSize: 11, fontWeight: 700, color: '#F59E0B' }}>Partiel</span>
    </div>
  );
  return (
    <div data-testid={testPrefix ? `${testPrefix}-pending` : undefined} style={{ padding: '4px 10px', borderRadius: 999, background: '#E5E7EB' } as any}>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#6B7280' }}>A faire</span>
    </div>
  );
}

function ActionButtons({ onEdit, onDelete, testPrefix }: { onEdit: () => void; onDelete: () => void; testPrefix?: string }) {
  return (
    <div style={{ display: 'flex', gap: 6, flexShrink: 0 } as any}>
      <div data-testid={testPrefix ? `edit-${testPrefix}` : undefined} onClick={(e: any) => { e.stopPropagation(); onEdit(); }}
        style={{ width: 32, height: 32, borderRadius: 999, background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' } as any}>
        <i className="ri-pencil-line" style={{ fontSize: 14, color: '#374151' }} />
      </div>
      <div onClick={(e: any) => { e.stopPropagation(); onDelete(); }}
        style={{ width: 32, height: 32, borderRadius: 999, background: 'rgba(239,68,68,0.08)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(239,68,68,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
        <i className="ri-delete-bin-6-line" style={{ fontSize: 14, color: '#EF4444' }} />
      </div>
    </div>
  );
}

function EmptyDay({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ textAlign: 'center', padding: '20px 16px', color: '#9CA3AF', fontSize: 13, borderRadius: 16, background: '#F4F4F5', marginBottom: 16 } as any}>
      <i className={icon} style={{ fontSize: 24, display: 'block', marginBottom: 6, color: '#D1D5DB' }} />
      {text}
    </div>
  );
}
