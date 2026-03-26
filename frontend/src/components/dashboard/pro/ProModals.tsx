import React from 'react';
import { GlassModal, ImagePicker, DaysPicker, TimeWheelPicker } from './GlassModal';
import { API, INP, LBL, SEL, GBTN, MUSCLE_GROUPS, EQUIPMENT_LIST, SUPPLEMENT_TYPES, HYDRATION_TYPES, INGREDIENT_LIST } from './constants';
import { REMINDER_IMAGES } from '../constants';

interface ProModalsProps {
  modal: string | null;
  modalCtx: any;
  saving: boolean;
  token: string;
  AC: string;
  activeBenName: string;
  exerciseTemplates: any[];
  reminderTemplates: any[];
  mealTemplates: any[];
  // Forms
  exForm: any; setExForm: (v: any) => void;
  remAssignForm: any; setRemAssignForm: (v: any) => void;
  mealAssignForm: any; setMealAssignForm: (v: any) => void;
  editExForm: any; setEditExForm: (v: any) => void;
  editRemForm: any; setEditRemForm: (v: any) => void;
  editMealForm: any; setEditMealForm: (v: any) => void;
  mealForm: any; setMealForm: (v: any) => void;
  remForm: any; setRemForm: (v: any) => void;
  exTplForm: any; setExTplForm: (v: any) => void;
  // Actions
  setModal: (v: string | null) => void;
  setModalCtx: (v: any) => void;
  setTab: (v: 'patients' | 'library') => void;
  assignExercise: (tplId: string, days: string[], reps: number, sets: number, rest: number) => void;
  assignReminder: (tplId: string, days: string[], time: string, dosage: string, notes: string) => void;
  assignMeal: (tplId: string, days: string[], mealType: string) => void;
  updateAssignedExercise: () => void;
  updateAssignedReminder: () => void;
  updateAssignedMeal: () => void;
  createExerciseTemplate: () => void;
  createMealTemplate: () => void;
  createReminderTemplate: () => void;
  // Empty form defaults
  emptyEx: any;
  editingTemplateId: string | null;
}

export function ProModals(props: ProModalsProps) {
  const { modal, modalCtx, saving, token, AC, activeBenName, exerciseTemplates, reminderTemplates, mealTemplates } = props;
  const { exForm, setExForm, remAssignForm, setRemAssignForm, mealAssignForm, setMealAssignForm } = props;
  const { editExForm, setEditExForm, editRemForm, setEditRemForm, editMealForm, setEditMealForm } = props;
  const { mealForm, setMealForm, remForm, setRemForm, exTplForm, setExTplForm } = props;
  const { setModal, setModalCtx, setTab, emptyEx, editingTemplateId } = props;

  const close = () => { setModal(null); setModalCtx(null); };

  return (
    <>
      {/* Assign Exercise */}
      <GlassModal open={modal === 'assign-ex'} onClose={close} title="Ajouter un exercice">
        {exerciseTemplates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: '#9CA3AF', fontSize: 13 } as any}>
            Aucun exercice dans la bibliotheque.<br/>
            <span onClick={() => { setModal(null); setTab('library'); }} style={{ color: AC, cursor: 'pointer', fontWeight: 700, marginTop: 8, display: 'inline-block' }}>Creer un exercice</span>
          </div>
        ) : !modalCtx ? (
          <>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 14 }}>Choisissez un exercice de la bibliotheque :</div>
            {exerciseTemplates.map(tpl => (
              <div key={tpl.id} onClick={() => { setModalCtx(tpl.id); setExForm({ ...emptyEx, title: tpl.title, days: [], reps: tpl.repetitions || 12, sets: tpl.sets || 3, rest_seconds: tpl.rest_seconds || 60 }); }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, marginBottom: 6, background: '#F4F4F5', border: '1px solid #E5E7EB', cursor: 'pointer', transition: 'background 0.15s' } as any}
                onMouseEnter={(e: any) => e.currentTarget.style.background = '#ECECED'}
                onMouseLeave={(e: any) => e.currentTarget.style.background = '#F4F4F5'}>
                {tpl.image ? <div style={{ width: 40, height: 40, borderRadius: 10, overflow: 'hidden', flexShrink: 0 } as any}><img src={tpl.image.startsWith('/') ? `${API}${tpl.image}` : tpl.image} style={{ width: '100%', height: '100%', objectFit: 'cover' } as any} /></div>
                : <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className="ri-run-line" style={{ fontSize: 18, color: AC }} /></div>}
                <div style={{ flex: 1, minWidth: 0 } as any}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' } as any}>{tpl.title}</div>
                  <div style={{ fontSize: 10, color: '#9CA3AF' }}>{tpl.muscle_group || tpl.category} - {tpl.difficulty}</div>
                </div>
                <i className="ri-arrow-right-s-line" style={{ fontSize: 18, color: '#D1D5DB' }} />
              </div>
            ))}
          </>
        ) : (
          <>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 14 }}>Personnalisez pour {activeBenName} :</div>
            <div style={{ marginBottom: 16 }}>
              <label style={LBL}>Jours de la semaine</label>
              <DaysPicker selected={exForm.days || []} onChange={days => setExForm({ ...exForm, days })} accent={AC} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 } as any}>
              <div style={{ flex: 1 }}><label style={LBL}>Series</label><input type="number" value={exForm.sets} onChange={(e: any) => setExForm({ ...exForm, sets: +e.target.value })} style={INP} /></div>
              <div style={{ flex: 1 }}><label style={LBL}>Repetitions</label><input type="number" value={exForm.reps} onChange={(e: any) => setExForm({ ...exForm, reps: +e.target.value })} style={INP} /></div>
              <div style={{ flex: 1 }}><label style={LBL}>Repos (s)</label><input type="number" value={exForm.rest_seconds || 60} onChange={(e: any) => setExForm({ ...exForm, rest_seconds: +e.target.value })} style={INP} /></div>
            </div>
            <div data-testid="assign-ex-submit" onClick={() => { const days = exForm.days || []; if (days.length === 0) return; props.assignExercise(modalCtx, days, exForm.reps || 12, exForm.sets || 3, exForm.rest_seconds || 60); }} style={GBTN((exForm.days || []).length > 0, saving)}>
              {saving ? 'Assignation...' : `Assigner ${(exForm.days || []).length > 0 ? `(${(exForm.days || []).length} jours)` : '-- Choisissez des jours'}`}
            </div>
          </>
        )}
      </GlassModal>

      {/* Edit Assigned Exercise */}
      <GlassModal open={modal === 'edit-assigned' && !!editExForm} onClose={() => { setModal(null); setEditExForm(null); }} title="Modifier l'exercice">
        {editExForm && (
          <>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#111', marginBottom: 4, textTransform: 'capitalize' }}>{editExForm.title}</div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 18 }}>{editExForm.muscle_group || editExForm.category}</div>
            <div style={{ marginBottom: 16 }}><label style={LBL}>Jours de la semaine</label><DaysPicker selected={editExForm.days || []} onChange={days => setEditExForm({ ...editExForm, days })} accent={AC} /></div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 } as any}>
              <div style={{ flex: 1 }}><label style={LBL}>Series</label><input type="number" value={editExForm.sets} onChange={(e: any) => setEditExForm({ ...editExForm, sets: +e.target.value })} style={INP} /></div>
              <div style={{ flex: 1 }}><label style={LBL}>Repetitions</label><input type="number" value={editExForm.repetitions} onChange={(e: any) => setEditExForm({ ...editExForm, repetitions: +e.target.value })} style={INP} /></div>
              <div style={{ flex: 1 }}><label style={LBL}>Repos (s)</label><input type="number" value={editExForm.rest_seconds} onChange={(e: any) => setEditExForm({ ...editExForm, rest_seconds: +e.target.value })} style={INP} /></div>
            </div>
            <div data-testid="edit-ex-submit" onClick={(editExForm.days || []).length > 0 ? props.updateAssignedExercise : undefined} style={GBTN((editExForm.days || []).length > 0, saving)}>
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </div>
          </>
        )}
      </GlassModal>

      {/* Edit Assigned Reminder */}
      <GlassModal open={modal === 'edit-rem' && !!editRemForm} onClose={() => { setModal(null); setEditRemForm(null); }} title="Modifier le complement">
        {editRemForm && (
          <>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#111', marginBottom: 4, textTransform: 'capitalize' }}>{editRemForm.title}</div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 18 }}>{editRemForm.reminder_type || 'supplement'}</div>
            <div style={{ marginBottom: 16 }}><label style={LBL}>Jours de la semaine</label><DaysPicker selected={editRemForm.days || []} onChange={days => setEditRemForm({ ...editRemForm, days })} accent={AC} /></div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 14 } as any}>
              <div style={{ flex: 1 }}><label style={LBL}>Heure</label><input type="time" value={editRemForm.time || ''} onChange={(e: any) => setEditRemForm({ ...editRemForm, time: e.target.value })} style={INP} /></div>
              <div style={{ flex: 1 }}><label style={LBL}>Dosage</label><input type="text" value={editRemForm.dosage || ''} onChange={(e: any) => setEditRemForm({ ...editRemForm, dosage: e.target.value })} style={INP} /></div>
            </div>
            <div data-testid="edit-rem-submit" onClick={(editRemForm.days || []).length > 0 ? props.updateAssignedReminder : undefined} style={GBTN((editRemForm.days || []).length > 0, saving)}>
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </div>
          </>
        )}
      </GlassModal>

      {/* Edit Assigned Meal */}
      <GlassModal open={modal === 'edit-meal' && !!editMealForm} onClose={() => { setModal(null); setEditMealForm(null); }} title="Modifier le repas">
        {editMealForm && (
          <>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#111', marginBottom: 4, textTransform: 'capitalize' }}>{editMealForm.title}</div>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 18 }}>{(editMealForm.meal_type || '').replace('_', ' ')}</div>
            <div style={{ marginBottom: 16 }}><label style={LBL}>Jours de la semaine</label><DaysPicker selected={editMealForm.days || []} onChange={days => setEditMealForm({ ...editMealForm, days })} accent={AC} /></div>
            <div style={{ marginBottom: 14 }}>
              <label style={LBL}>Type de repas</label>
              <select value={editMealForm.meal_type || 'dejeuner'} onChange={(e: any) => setEditMealForm({ ...editMealForm, meal_type: e.target.value })} style={INP}>
                <option value="petit_dejeuner">Petit-dejeuner</option><option value="dejeuner">Dejeuner</option><option value="collation">Collation</option><option value="gouter">Gouter</option><option value="diner">Diner</option>
              </select>
            </div>
            <div data-testid="edit-meal-submit" onClick={(editMealForm.days || []).length > 0 ? props.updateAssignedMeal : undefined} style={GBTN((editMealForm.days || []).length > 0, saving)}>
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </div>
          </>
        )}
      </GlassModal>

      {/* Assign Reminder */}
      <GlassModal open={modal === 'assign-rem'} onClose={close} title="Assigner un complement">
        {(() => { const compTemplates = reminderTemplates.filter(t => t.reminder_type !== 'hydration'); return compTemplates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: '#9CA3AF', fontSize: 13 } as any}>
            Aucun complement dans la bibliotheque.<br/>
            <span onClick={() => { setModal(null); setTab('library'); }} style={{ color: '#F59E0B', cursor: 'pointer', fontWeight: 700, marginTop: 8, display: 'inline-block' }}>Creer un complement</span>
          </div>
        ) : !modalCtx ? (
          <>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 14 }}>Choisissez un complement :</div>
            <div style={{ maxHeight: '50vh', overflowY: 'auto' } as any}>
            {compTemplates.map(tpl => {
              const tplImg = tpl.image || REMINDER_IMAGES.medication;
              return (
              <div key={tpl.id} onClick={() => { setModalCtx(tpl.id); setRemAssignForm({ days: [], time: tpl.time || '08:00', dosage: tpl.dosage || '' }); }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, marginBottom: 6, background: '#F4F4F5', border: '1px solid #E5E7EB', cursor: 'pointer' } as any}
                onMouseEnter={(e: any) => e.currentTarget.style.background = '#ECECED'}
                onMouseLeave={(e: any) => e.currentTarget.style.background = '#F4F4F5'}>
                <div style={{ width: 40, height: 40, borderRadius: 10, overflow: 'hidden', flexShrink: 0 } as any}>
                  <img src={tplImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' } as any} />
                </div>
                <div style={{ flex: 1, minWidth: 0 } as any}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{tpl.title}</div>
                  <div style={{ fontSize: 10, color: '#9CA3AF' }}>{tpl.dosage} - {tpl.time}</div>
                </div>
                <i className="ri-arrow-right-s-line" style={{ fontSize: 18, color: '#D1D5DB' }} />
              </div>
              );
            })}
            </div>
          </>
        ) : (
          <>
            {(() => { const selTpl = reminderTemplates.find(t => t.id === modalCtx); const selImg = selTpl?.image || (selTpl?.reminder_type === 'hydration' ? REMINDER_IMAGES.hydration : REMINDER_IMAGES.medication); return (
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18, padding: '12px 14px', borderRadius: 16, background: '#F4F4F5', border: '1px solid #E5E7EB' } as any}>
                <div style={{ width: 52, height: 52, borderRadius: 12, overflow: 'hidden', flexShrink: 0 } as any}>
                  <img src={selImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' } as any} />
                </div>
                <div style={{ flex: 1 } as any}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#111' }}>{selTpl?.title}</div>
                  <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{selTpl?.reminder_type === 'hydration' ? 'Hydratation' : 'Supplement'}</div>
                </div>
                <div onClick={() => setModalCtx(null)} style={{ width: 28, height: 28, borderRadius: 999, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
                  <i className="ri-arrow-left-s-line" style={{ fontSize: 16, color: '#9CA3AF' }} />
                </div>
              </div>
            ); })()}
            <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 14 }}>Personnalisez pour {activeBenName} :</div>
            <div style={{ marginBottom: 16 }}><label style={LBL}>Jours de la semaine</label><DaysPicker selected={remAssignForm.days} onChange={days => setRemAssignForm({ ...remAssignForm, days })} accent="#F59E0B" /></div>
            <div style={{ marginBottom: 14 }}><label style={LBL}>Heure</label><TimeWheelPicker value={remAssignForm.time} onChange={time => setRemAssignForm({ ...remAssignForm, time })} /></div>
            <div style={{ marginBottom: 14 }}><label style={LBL}>Dosage</label><input value={remAssignForm.dosage} onChange={(e: any) => setRemAssignForm({ ...remAssignForm, dosage: e.target.value })} style={INP} placeholder="5g/jour" /></div>
            <div style={{ marginBottom: 14 }}><label style={LBL}>Note (optionnel)</label><input value={remAssignForm.notes || ''} onChange={(e: any) => setRemAssignForm({ ...remAssignForm, notes: e.target.value })} style={INP} placeholder="Ex: Prendre avec un verre d'eau" /></div>
            <div data-testid="assign-rem-submit" onClick={() => remAssignForm.days.length > 0 ? props.assignReminder(modalCtx, remAssignForm.days, remAssignForm.time, remAssignForm.dosage, remAssignForm.notes || '') : undefined} style={GBTN(remAssignForm.days.length > 0, saving)}>
              {saving ? 'Assignation...' : `Assigner ${remAssignForm.days.length > 0 ? `(${remAssignForm.days.length} jours)` : '-- Choisissez des jours'}`}
            </div>
          </>
        ); })()}
      </GlassModal>

      {/* Assign Hydration */}
      <GlassModal open={modal === 'assign-hydration'} onClose={close} title="Assigner une hydratation">
        {(() => { const hydrationTpls = reminderTemplates.filter(t => t.reminder_type === 'hydration'); return hydrationTpls.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: '#9CA3AF', fontSize: 13 } as any}>
            Aucun rappel hydratation dans la bibliotheque.<br/>
            <span onClick={() => { setModal(null); setTab('library'); }} style={{ color: '#38BDF8', cursor: 'pointer', fontWeight: 700, marginTop: 8, display: 'inline-block' }}>Creer un rappel hydratation</span>
          </div>
        ) : !modalCtx ? (
          <>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 14 }}>Choisissez un rappel hydratation :</div>
            <div style={{ maxHeight: '50vh', overflowY: 'auto' } as any}>
            {hydrationTpls.map(tpl => {
              const tplImg = tpl.image || REMINDER_IMAGES.hydration;
              return (
              <div key={tpl.id} onClick={() => { setModalCtx(tpl.id); setRemAssignForm({ days: [], time: tpl.time || '08:00', dosage: tpl.dosage || '' }); }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, marginBottom: 6, background: '#F4F4F5', border: '1px solid #E5E7EB', cursor: 'pointer' } as any}
                onMouseEnter={(e: any) => e.currentTarget.style.background = '#ECECED'}
                onMouseLeave={(e: any) => e.currentTarget.style.background = '#F4F4F5'}>
                <div style={{ width: 40, height: 40, borderRadius: 10, overflow: 'hidden', flexShrink: 0 } as any}>
                  <img src={tplImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' } as any} />
                </div>
                <div style={{ flex: 1, minWidth: 0 } as any}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{tpl.title}</div>
                  <div style={{ fontSize: 10, color: '#9CA3AF' }}>{tpl.dosage} - {tpl.time}</div>
                </div>
                <i className="ri-arrow-right-s-line" style={{ fontSize: 18, color: '#D1D5DB' }} />
              </div>
              );
            })}
            </div>
          </>
        ) : (
          <>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 14 }}>Personnalisez pour {activeBenName} :</div>
            <div style={{ marginBottom: 16 }}><label style={LBL}>Jours de la semaine</label><DaysPicker selected={remAssignForm.days} onChange={days => setRemAssignForm({ ...remAssignForm, days })} accent="#38BDF8" /></div>
            <div style={{ marginBottom: 14 }}><label style={LBL}>Heure</label><TimeWheelPicker value={remAssignForm.time} onChange={time => setRemAssignForm({ ...remAssignForm, time })} /></div>
            <div style={{ marginBottom: 14 }}><label style={LBL}>Dosage</label><input value={remAssignForm.dosage} onChange={(e: any) => setRemAssignForm({ ...remAssignForm, dosage: e.target.value })} style={INP} placeholder="500ml" /></div>
            <div style={{ marginBottom: 14 }}><label style={LBL}>Note (optionnel)</label><input value={remAssignForm.notes || ''} onChange={(e: any) => setRemAssignForm({ ...remAssignForm, notes: e.target.value })} style={INP} placeholder="Ex: Boire avant le repas" /></div>
            <div data-testid="assign-hydration-submit" onClick={() => remAssignForm.days.length > 0 ? props.assignReminder(modalCtx, remAssignForm.days, remAssignForm.time, remAssignForm.dosage, remAssignForm.notes || '') : undefined} style={GBTN(remAssignForm.days.length > 0, saving)}>
              {saving ? 'Assignation...' : `Assigner ${remAssignForm.days.length > 0 ? `(${remAssignForm.days.length} jours)` : '-- Choisissez des jours'}`}
            </div>
          </>
        ); })()}
      </GlassModal>

      {/* Assign Meal */}
      <GlassModal open={modal === 'assign-meal'} onClose={close} title="Assigner un repas">
        {mealTemplates.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '24px', color: '#9CA3AF', fontSize: 13 } as any}>
            Aucun repas dans la bibliotheque.<br/>
            <span onClick={() => { setModal(null); setTab('library'); }} style={{ color: '#10B981', cursor: 'pointer', fontWeight: 700, marginTop: 8, display: 'inline-block' }}>Creer un repas</span>
          </div>
        ) : !modalCtx ? (
          <>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 14 }}>Choisissez un repas :</div>
            {mealTemplates.map(tpl => (
              <div key={tpl.id} onClick={() => { setModalCtx(tpl.id); setMealAssignForm({ days: [], meal_type: tpl.meal_type || 'dejeuner' }); }}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, marginBottom: 6, background: '#F4F4F5', border: '1px solid #E5E7EB', cursor: 'pointer' } as any}
                onMouseEnter={(e: any) => e.currentTarget.style.background = '#ECECED'}
                onMouseLeave={(e: any) => e.currentTarget.style.background = '#F4F4F5'}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                  <i className="ri-restaurant-fill" style={{ fontSize: 18, color: '#10B981' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 } as any}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>{tpl.title}</div>
                  <div style={{ fontSize: 10, color: '#9CA3AF' }}>{(tpl.meal_type || '').replace('_', ' ')} {tpl.calories ? `- ${tpl.calories} kcal` : ''}</div>
                </div>
                <i className="ri-arrow-right-s-line" style={{ fontSize: 18, color: '#D1D5DB' }} />
              </div>
            ))}
          </>
        ) : (
          <>
            <div style={{ fontSize: 12, color: '#9CA3AF', marginBottom: 14 }}>Personnalisez pour {activeBenName} :</div>
            <div style={{ marginBottom: 16 }}><label style={LBL}>Jours de la semaine</label><DaysPicker selected={mealAssignForm.days} onChange={days => setMealAssignForm({ ...mealAssignForm, days })} accent="#10B981" /></div>
            <div data-testid="assign-meal-submit" onClick={() => mealAssignForm.days.length > 0 ? props.assignMeal(modalCtx, mealAssignForm.days, mealAssignForm.meal_type) : undefined} style={GBTN(mealAssignForm.days.length > 0, saving)}>
              {saving ? 'Assignation...' : `Assigner ${mealAssignForm.days.length > 0 ? `(${mealAssignForm.days.length} jours)` : '-- Choisissez des jours'}`}
            </div>
          </>
        )}
      </GlassModal>

      {/* New Meal */}
      <GlassModal open={modal === 'new-meal'} onClose={() => setModal(null)} title={editingTemplateId ? "Modifier le repas" : "Nouveau repas"}>
        <ImagePicker value={mealForm.image} onChange={url => setMealForm({ ...mealForm, image: url })} token={token} />
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 } as any}>
          <div style={{ flex: 1 }}><label style={LBL}>Type</label><select value={mealForm.meal_type} onChange={(e: any) => setMealForm({ ...mealForm, meal_type: e.target.value })} style={SEL}><option value="petit_dejeuner">Petit-dejeuner</option><option value="dejeuner">Dejeuner</option><option value="gouter">Gouter</option><option value="diner">Diner</option><option value="collation">Collation</option></select></div>
          <div style={{ flex: 1 }}><label style={LBL}>Titre</label><input value={mealForm.title} onChange={(e: any) => setMealForm({ ...mealForm, title: e.target.value })} style={INP} placeholder="Ex: Salade proteines" /></div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ ...LBL, marginBottom: 0 }}>Ingredients</label>
            <div onClick={() => setMealForm({ ...mealForm, ingredients: [...mealForm.ingredients, { name: '', quantity: '', unit: 'g' }] })}
              style={{ fontSize: 11, fontWeight: 700, color: AC, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 } as any}><i className="ri-add-line" style={{ fontSize: 14 }} /> Ajouter</div>
          </div>
          {mealForm.ingredients.map((ing: any, i: number) => (
            <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' } as any}>
              <select value={ing.name} onChange={(e: any) => { const arr = [...mealForm.ingredients]; arr[i] = { ...arr[i], name: e.target.value }; setMealForm({ ...mealForm, ingredients: arr }); }} style={{ ...SEL, flex: 2 }}>
                <option value="">Choisir...</option>
                {INGREDIENT_LIST.map(item => <option key={item} value={item}>{item}</option>)}
              </select>
              <input value={ing.quantity} onChange={(e: any) => { const arr = [...mealForm.ingredients]; arr[i] = { ...arr[i], quantity: e.target.value }; setMealForm({ ...mealForm, ingredients: arr }); }} style={{ ...INP, flex: 1 }} placeholder="Qte" />
              <select value={ing.unit} onChange={(e: any) => { const arr = [...mealForm.ingredients]; arr[i] = { ...arr[i], unit: e.target.value }; setMealForm({ ...mealForm, ingredients: arr }); }} style={{ ...SEL, width: 60, flex: 'none' }}><option value="g">g</option><option value="ml">ml</option><option value="pc">pc</option><option value="cs">c.s.</option><option value="cc">c.c.</option></select>
              {mealForm.ingredients.length > 1 && <div onClick={() => setMealForm({ ...mealForm, ingredients: mealForm.ingredients.filter((_: any, j: number) => j !== i) })} style={{ cursor: 'pointer', flexShrink: 0 } as any}><i className="ri-close-line" style={{ fontSize: 16, color: '#EF4444' }} /></div>}
            </div>
          ))}
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ ...LBL, marginBottom: 0 }}>Etapes de preparation</label>
            <div onClick={() => setMealForm({ ...mealForm, steps: [...mealForm.steps, ''] })}
              style={{ fontSize: 11, fontWeight: 700, color: AC, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 } as any}><i className="ri-add-line" style={{ fontSize: 14 }} /> Ajouter</div>
          </div>
          {mealForm.steps.map((s: string, i: number) => (
            <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' } as any}>
              <input value={s} onChange={(e: any) => { const arr = [...mealForm.steps]; arr[i] = e.target.value; setMealForm({ ...mealForm, steps: arr }); }} style={{ ...INP, flex: 1 }} placeholder={`Etape ${i + 1}`} />
              {mealForm.steps.length > 1 && <div onClick={() => setMealForm({ ...mealForm, steps: mealForm.steps.filter((_: any, j: number) => j !== i) })} style={{ cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 16, color: '#EF4444' }} /></div>}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 } as any}>
          <div style={{ flex: 1 }}><label style={LBL}>Calories</label><input type="number" value={mealForm.calories} onChange={(e: any) => setMealForm({ ...mealForm, calories: +e.target.value })} style={INP} /></div>
          <div style={{ flex: 1 }}><label style={LBL}>Prot. (g)</label><input type="number" value={mealForm.proteins} onChange={(e: any) => setMealForm({ ...mealForm, proteins: +e.target.value })} style={INP} /></div>
          <div style={{ flex: 1 }}><label style={LBL}>Gluc. (g)</label><input type="number" value={mealForm.glucides} onChange={(e: any) => setMealForm({ ...mealForm, glucides: +e.target.value })} style={INP} /></div>
          <div style={{ flex: 1 }}><label style={LBL}>Lip. (g)</label><input type="number" value={mealForm.lipides} onChange={(e: any) => setMealForm({ ...mealForm, lipides: +e.target.value })} style={INP} /></div>
        </div>
        <div style={{ marginBottom: 14 }}><label style={LBL}>Notes</label><input value={mealForm.notes} onChange={(e: any) => setMealForm({ ...mealForm, notes: e.target.value })} style={INP} placeholder="Conseils, variantes..." /></div>
        <div data-testid="meal-submit" onClick={mealForm.title || mealForm.ingredients.some((i: any) => i.name) ? props.createMealTemplate : undefined} style={GBTN(!!mealForm.title || mealForm.ingredients.some((i: any) => !!i.name), saving)}>{saving ? 'Enregistrement...' : editingTemplateId ? 'Modifier dans la bibliotheque' : 'Enregistrer dans la bibliotheque'}</div>
      </GlassModal>

      {/* New Reminder (Complement) */}
      <GlassModal open={modal === 'new-rem'} onClose={() => setModal(null)} title={editingTemplateId ? (remForm.reminder_type === 'hydration' ? 'Modifier hydratation' : 'Modifier complement') : (remForm.reminder_type === 'hydration' ? 'Nouvelle hydratation' : 'Nouveau complement')}>
        <div style={{ marginBottom: 14 }}><label style={LBL}>Type</label>
          {remForm.reminder_type === 'hydration' ? (
            <select value={remForm.title || ''} onChange={(e: any) => setRemForm({ ...remForm, title: e.target.value })} style={SEL}>
              <option value="">Choisir...</option>
              {HYDRATION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          ) : (
            <select value={remForm.title || ''} onChange={(e: any) => setRemForm({ ...remForm, title: e.target.value })} style={SEL}>
              <option value="">Choisir...</option>
              {SUPPLEMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          )}
        </div>
        {remForm.title === 'Autre' && (
          <div style={{ marginBottom: 14 }}><label style={LBL}>Nom personnalise</label><input value={remForm.notes} onChange={(e: any) => setRemForm({ ...remForm, notes: e.target.value })} style={INP} placeholder="Nom du complement" /></div>
        )}
        <div data-testid="rem-submit" onClick={remForm.title ? props.createReminderTemplate : undefined} style={GBTN(!!remForm.title, saving)}>{saving ? 'Enregistrement...' : editingTemplateId ? 'Modifier dans la bibliotheque' : 'Enregistrer dans la bibliotheque'}</div>
      </GlassModal>

      {/* New Exercise Template */}
      <GlassModal open={modal === 'new-ex-tpl'} onClose={() => setModal(null)} title={editingTemplateId ? "Modifier l'exercice" : "Nouvel exercice"}>
        <ImagePicker value={exTplForm.image} onChange={url => setExTplForm({ ...exTplForm, image: url })} token={token} />
        <div style={{ marginBottom: 14 }}><label style={LBL}>Titre</label><input data-testid="extpl-title" value={exTplForm.title} onChange={(e: any) => setExTplForm({ ...exTplForm, title: e.target.value })} style={INP} placeholder="Ex: Squat bulgare" /></div>
        <div style={{ marginBottom: 14 }}><label style={LBL}>Description</label><textarea value={exTplForm.description} onChange={(e: any) => setExTplForm({ ...exTplForm, description: e.target.value })} style={{ ...INP, height: 70, resize: 'none' } as any} placeholder="Instructions detaillees..." /></div>
        {/* Video upload */}
        <div style={{ marginBottom: 14 }}>
          <label style={LBL}>Video explicative</label>
          {exTplForm.video_url ? (
            <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: '#000', marginBottom: 6 } as any}>
              <video src={exTplForm.video_url.startsWith('/') ? `${API}${exTplForm.video_url}` : exTplForm.video_url} controls style={{ width: '100%', maxHeight: 160 } as any} />
              <div onClick={() => setExTplForm({ ...exTplForm, video_url: '' })} style={{ position: 'absolute', top: 6, right: 6, width: 28, height: 28, borderRadius: 999, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 14, color: '#FFF' }} /></div>
            </div>
          ) : (
            <div onClick={() => { const input = document.createElement('input'); input.type = 'file'; input.accept = 'video/*'; input.capture = 'environment'; input.onchange = async () => { const f = input.files?.[0]; if (!f) return; try { const fd = new FormData(); fd.append('file', f); const r = await fetch(`${API}/api/pro/upload-image`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd }); const d = await r.json(); if (d.url) setExTplForm({ ...exTplForm, video_url: d.url }); } catch {} }; input.click(); }}
              style={{ padding: '16px', borderRadius: 12, border: '2px dashed #D1D5DB', background: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' } as any}>
              <i className="ri-video-add-line" style={{ fontSize: 20, color: '#9CA3AF' }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#6B7280' }}>Filmer ou deposer une video</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 } as any}>
          <div style={{ flex: 1 }}><label style={LBL}>Categorie</label><select value={exTplForm.category} onChange={(e: any) => setExTplForm({ ...exTplForm, category: e.target.value })} style={SEL}><option value="general">General</option><option value="force">Force</option><option value="cardio">Cardio</option><option value="mobilite">Mobilite</option><option value="equilibre">Equilibre</option><option value="souplesse">Souplesse</option></select></div>
          <div style={{ flex: 1 }}><label style={LBL}>Difficulte</label><select value={exTplForm.difficulty} onChange={(e: any) => setExTplForm({ ...exTplForm, difficulty: e.target.value })} style={SEL}><option value="facile">Facile</option><option value="moyen">Moyen</option><option value="difficile">Difficile</option></select></div>
        </div>
        {/* Multi-select Muscle Groups */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ ...LBL, marginBottom: 0 }}>Groupes musculaires</label>
            <div onClick={() => { const current = (exTplForm.muscle_group || '').split(',').map((s: string) => s.trim()).filter(Boolean); setExTplForm({ ...exTplForm, muscle_group: [...current, ''].join(', ') }); }}
              style={{ fontSize: 11, fontWeight: 700, color: AC, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 } as any}><i className="ri-add-line" style={{ fontSize: 14 }} /> Ajouter</div>
          </div>
          {(() => { const groups = (exTplForm.muscle_group || '').split(',').map((s: string) => s.trim()); if (groups.length === 0 || (groups.length === 1 && !groups[0])) groups.splice(0, groups.length, ''); return groups.map((g: string, i: number) => (
            <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' } as any}>
              <select value={g} onChange={(e: any) => { const arr = [...groups]; arr[i] = e.target.value; setExTplForm({ ...exTplForm, muscle_group: arr.filter(Boolean).join(', ') }); }} style={{ ...SEL, flex: 1 }}>
                <option value="">Choisir...</option>
                {MUSCLE_GROUPS.map(mg => <option key={mg} value={mg}>{mg}</option>)}
              </select>
              {groups.filter(Boolean).length > 1 && <div onClick={() => { const arr = [...groups]; arr.splice(i, 1); setExTplForm({ ...exTplForm, muscle_group: arr.filter(Boolean).join(', ') }); }} style={{ cursor: 'pointer', flexShrink: 0 } as any}><i className="ri-close-line" style={{ fontSize: 16, color: '#EF4444' }} /></div>}
            </div>
          )); })()}
        </div>
        {/* Multi-select Equipment */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ ...LBL, marginBottom: 0 }}>Materiel</label>
            <div onClick={() => { const current = (exTplForm.equipment || '').split(',').map((s: string) => s.trim()).filter(Boolean); setExTplForm({ ...exTplForm, equipment: [...current, ''].join(', ') }); }}
              style={{ fontSize: 11, fontWeight: 700, color: AC, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 } as any}><i className="ri-add-line" style={{ fontSize: 14 }} /> Ajouter</div>
          </div>
          {(() => { const eqs = (exTplForm.equipment || '').split(',').map((s: string) => s.trim()); if (eqs.length === 0 || (eqs.length === 1 && !eqs[0])) eqs.splice(0, eqs.length, ''); return eqs.map((eq: string, i: number) => (
            <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' } as any}>
              <select value={eq} onChange={(e: any) => { const arr = [...eqs]; arr[i] = e.target.value; setExTplForm({ ...exTplForm, equipment: arr.filter(Boolean).join(', ') }); }} style={{ ...SEL, flex: 1 }}>
                <option value="">Choisir...</option>
                {EQUIPMENT_LIST.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
              {eqs.filter(Boolean).length > 1 && <div onClick={() => { const arr = [...eqs]; arr.splice(i, 1); setExTplForm({ ...exTplForm, equipment: arr.filter(Boolean).join(', ') }); }} style={{ cursor: 'pointer', flexShrink: 0 } as any}><i className="ri-close-line" style={{ fontSize: 16, color: '#EF4444' }} /></div>}
            </div>
          )); })()}
        </div>
        {/* Steps */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <label style={{ ...LBL, marginBottom: 0 }}>Etapes / Instructions</label>
            <div onClick={() => setExTplForm({ ...exTplForm, steps: [...exTplForm.steps, ''] })}
              style={{ fontSize: 11, fontWeight: 700, color: AC, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 } as any}><i className="ri-add-line" style={{ fontSize: 14 }} /> Ajouter</div>
          </div>
          {exTplForm.steps.map((s: string, i: number) => (
            <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 6, alignItems: 'center' } as any}>
              <input value={s} onChange={(e: any) => { const arr = [...exTplForm.steps]; arr[i] = e.target.value; setExTplForm({ ...exTplForm, steps: arr }); }} style={{ ...INP, flex: 1 }} placeholder={`Etape ${i + 1}`} />
              {exTplForm.steps.length > 1 && <div onClick={() => setExTplForm({ ...exTplForm, steps: exTplForm.steps.filter((_: any, j: number) => j !== i) })} style={{ cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 16, color: '#EF4444' }} /></div>}
            </div>
          ))}
        </div>
        <div data-testid="extpl-submit" onClick={exTplForm.title ? props.createExerciseTemplate : undefined} style={GBTN(!!exTplForm.title, saving)}>{saving ? 'Enregistrement...' : editingTemplateId ? 'Modifier dans la bibliotheque' : 'Enregistrer dans la bibliotheque'}</div>
      </GlassModal>
    </>
  );
}
