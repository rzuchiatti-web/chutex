import React from 'react';
import { API } from './constants';

interface ProLibraryProps {
  AC: string;
  exerciseTemplates: any[];
  reminderTemplates: any[];
  mealTemplates: any[];
  router: any;
  onNewExercise: () => void;
  onNewReminder: () => void;
  onNewHydration: () => void;
  onNewMeal: () => void;
  onDeleteExerciseTemplate: (id: string) => void;
  onDeleteReminderTemplate: (id: string) => void;
  onDeleteMealTemplate: (id: string) => void;
}

export function ProLibrary(props: ProLibraryProps) {
  const { AC, exerciseTemplates, reminderTemplates, mealTemplates, router } = props;

  return (
    <>
      {/* Exercices Card */}
      <LibrarySection icon="ri-run-line" iconBg={`${AC}15`} iconColor={AC} title="Exercices" count={exerciseTemplates.length}
        addColor={AC} onAdd={props.onNewExercise} testId="lib-add-new-ex-tpl">
        {exerciseTemplates.length === 0 && <EmptyLib text="Aucun exercice dans la bibliotheque" />}
        {exerciseTemplates.map(ex => (
          <ItemCard key={ex.id} accent={AC} title={ex.title}
            subtitle={`${ex.muscle_group || ex.category || ''} - ${ex.difficulty || ''}`}
            badge={ex.sets > 0 ? `${ex.sets}x${ex.repetitions}` : ''}
            image={ex.image}
            onClick={() => router.push({ pathname: '/pro-exercise-detail' as any, params: { id: ex.id, mode: 'template' } })}
            onDelete={() => props.onDeleteExerciseTemplate(ex.id)} />
        ))}
      </LibrarySection>

      {/* Complements Card */}
      <LibrarySection icon="ri-capsule-line" iconBg="#FEF3C7" iconColor="#F59E0B" title="Complements" count={reminderTemplates.length}
        addColor="#F59E0B" onAdd={props.onNewReminder} testId="lib-add-new-rem">
        {reminderTemplates.filter(r => r.reminder_type !== 'hydration').length === 0 && <EmptyLib text="Aucun complement" />}
        {reminderTemplates.filter(r => r.reminder_type !== 'hydration').map(r => (
          <ItemCard key={r.id} accent="#F59E0B" title={r.title}
            subtitle={`${r.dosage || ''} - ${r.time || ''}`}
            badge="Suppl."
            onDelete={() => props.onDeleteReminderTemplate(r.id)} />
        ))}
      </LibrarySection>

      {/* Hydratation Card */}
      <div style={{ background: '#FFF', borderRadius: 20, padding: '16px 14px', border: '1px solid #F3F4F6', marginBottom: 16 } as any}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 } as any}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: '#DBEAFE', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
              <i className="ri-drop-line" style={{ fontSize: 16, color: '#38BDF8' }} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#1F2937' }}>Hydratation</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', marginLeft: 4 }}>({reminderTemplates.filter(r => r.reminder_type === 'hydration').length})</span>
          </div>
          <div data-testid="lib-add-hydration" onClick={props.onNewHydration}
            style={{ width: 32, height: 32, borderRadius: 10, background: '#38BDF8', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
            <i className="ri-add-line" style={{ fontSize: 18, color: '#FFF' }} />
          </div>
        </div>
        {reminderTemplates.filter(r => r.reminder_type === 'hydration').length === 0 && <EmptyLib text="Aucun rappel hydratation" />}
        {reminderTemplates.filter(r => r.reminder_type === 'hydration').map(r => (
          <ItemCard key={r.id} accent="#38BDF8" title={r.title}
            subtitle={`${r.dosage || ''} - ${r.time || ''}`}
            badge="Hydrat."
            onDelete={() => props.onDeleteReminderTemplate(r.id)} />
        ))}
      </div>

      {/* Repas Card */}
      <LibrarySection icon="ri-restaurant-line" iconBg="#D1FAE5" iconColor="#10B981" title="Repas" count={mealTemplates.length}
        addColor="#10B981" onAdd={props.onNewMeal} testId="lib-add-new-meal">
        {mealTemplates.length === 0 && <EmptyLib text="Aucun repas" />}
        {mealTemplates.map(m => (
          <ItemCard key={m.id} accent="#10B981"
            title={m.title}
            subtitle={Array.isArray(m.items) ? m.items.slice(0, 3).join(', ') : ''}
            badge={m.calories ? `${m.calories} kcal` : (m.meal_type || '').replace('_', ' ')}
            onClick={() => router.push({ pathname: '/meal-detail' as any, params: { id: m.id, mode: 'template' } })}
            onDelete={() => props.onDeleteMealTemplate(m.id)} />
        ))}
      </LibrarySection>
    </>
  );
}

/* ── Small helpers ── */

function LibrarySection({ icon, iconBg, iconColor, title, count, addColor, onAdd, testId, children }: {
  icon: string; iconBg: string; iconColor: string; title: string; count: number; addColor: string; onAdd: () => void; testId: string; children: React.ReactNode;
}) {
  return (
    <div style={{ borderRadius: 18, background: '#F3F4F6', padding: 16, marginBottom: 16 } as any}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 } as any}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 } as any}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
            <i className={icon} style={{ fontSize: 16, color: iconColor }} />
          </div>
          <span style={{ fontSize: 14, fontWeight: 800, color: '#1F2937' }}>{title}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', marginLeft: 4 }}>({count})</span>
        </div>
        <div data-testid={testId} onClick={onAdd}
          style={{ width: 32, height: 32, borderRadius: 10, background: addColor, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
          <i className="ri-add-line" style={{ fontSize: 18, color: '#FFF' }} />
        </div>
      </div>
      {children}
    </div>
  );
}

function ItemCard({ title, subtitle, badge, accent, image, onClick, onDelete }: {
  title: string; subtitle: string; badge?: string; accent: string; image?: string;
  onClick?: () => void; onDelete?: () => void;
}) {
  return (
    <div data-testid={`item-card-${title}`} onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, background: '#FFF', marginBottom: 6, transition: 'all 0.15s', cursor: onClick ? 'pointer' : 'default' } as any}>
      {image && <div style={{ width: 44, height: 44, borderRadius: 10, overflow: 'hidden', flexShrink: 0 } as any}><img src={image.startsWith('/') ? `${API}${image}` : image} style={{ width: '100%', height: '100%', objectFit: 'cover' } as any} /></div>}
      <div style={{ flex: 1, minWidth: 0 } as any}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#111', textTransform: 'capitalize', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as any}>{title}</div>
        <div style={{ fontSize: 11, color: '#6B7280', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as any}>{subtitle}</div>
      </div>
      {badge && <span style={{ fontSize: 10, fontWeight: 700, color: accent, background: `${accent}10`, padding: '3px 8px', borderRadius: 999, flexShrink: 0 } as any}>{badge}</span>}
      {onDelete && (
        <div onClick={e => { e.stopPropagation(); onDelete(); }}
          style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(239,68,68,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 } as any}>
          <i className="ri-delete-bin-6-line" style={{ fontSize: 13, color: '#EF4444' }} />
        </div>
      )}
    </div>
  );
}

function EmptyLib({ text }: { text: string }) {
  return <div style={{ textAlign: 'center', padding: '20px 0', color: '#9CA3AF', fontSize: 12, fontWeight: 600 }}>{text}</div>;
}
