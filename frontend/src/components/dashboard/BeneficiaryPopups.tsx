import React from 'react';
import { useRouter } from 'expo-router';
import { apiFetch } from '../../services/api';
import { REMINDER_IMAGES } from './constants';

/* ─── NOTIFICATIONS POPUP ─── */
export function NotificationsPopup({ show, onClose, activeAlerts, guardianRequests }: any) {
  const router = useRouter();
  if (!show) return null;
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.3)', overflowY: 'auto' } as any}>
      <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '40px 24px 120px', boxSizing: 'border-box' } as any}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}>
          <div onClick={onClose} style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div>
        </div>
        <div style={{ textAlign: 'center', marginBottom: 24 } as any}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 } as any}><i className="ri-notification-3-line" style={{ fontSize: 26, color: 'rgba(255,255,255,0.6)' }} /></div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>Notifications</div>
        </div>
        {activeAlerts.length === 0 && guardianRequests.length === 0 && <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Aucune notification pour le moment.</div>}
        {activeAlerts.map((a: any) => (
          <div key={a.id} onClick={() => { onClose(); router.push({ pathname: '/alert-detail', params: { alertId: a.id } }); }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 16, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', marginBottom: 8, cursor: 'pointer' } as any}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className="ri-alarm-warning-line" style={{ fontSize: 18, color: '#EF4444' }} /></div>
            <div style={{ flex: 1 } as any}><div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{a.message}</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Alerte active</div></div>
            <i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.2)' }} />
          </div>
        ))}
        {guardianRequests.map((r: any) => (
          <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 8 } as any}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(167,139,250,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className="ri-shield-user-line" style={{ fontSize: 18, color: '#A78BFA' }} /></div>
            <div style={{ flex: 1 } as any}><div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{r.guardian_name || 'Demande gardien'}</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Demande de rattachement</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── LANGUAGE POPUP ─── */
export function LanguagePopup({ show, onClose, lang, setLang }: any) {
  if (!show) return null;
  const languages = [
    { code: 'FR', flag: '\u{1F1EB}\u{1F1F7}', name: 'Francais' },
    { code: 'EN', flag: '\u{1F1EC}\u{1F1E7}', name: 'English' },
    { code: 'DE', flag: '\u{1F1E9}\u{1F1EA}', name: 'Deutsch' },
    { code: 'ES', flag: '\u{1F1EA}\u{1F1F8}', name: 'Espanol' },
    { code: 'IT', flag: '\u{1F1EE}\u{1F1F9}', name: 'Italiano' },
    { code: 'PT', flag: '\u{1F1F5}\u{1F1F9}', name: 'Portugues' },
    { code: 'NL', flag: '\u{1F1F3}\u{1F1F1}', name: 'Nederlands' },
  ];
  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.4)', overflowY: 'auto' } as any}>
      <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '40px 24px 120px', boxSizing: 'border-box' } as any}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}>
          <div onClick={onClose} style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div>
        </div>
        <div style={{ textAlign: 'center', marginBottom: 28 } as any}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 } as any}><i className="ri-global-line" style={{ fontSize: 26, color: 'rgba(255,255,255,0.6)' }} /></div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>Langue</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>Selectionnez votre langue</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 } as any}>
          {languages.map(l => (
            <div key={l.code} onClick={() => { setLang(l.code); onClose(); }} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', borderRadius: 18, cursor: 'pointer', background: lang === l.code ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)', border: lang === l.code ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.05)', transition: 'all 0.2s' } as any}>
              <span style={{ fontSize: 32, lineHeight: 1 }}>{l.flag}</span>
              <span style={{ fontSize: 15, fontWeight: lang === l.code ? 800 : 500, color: lang === l.code ? '#FFF' : 'rgba(255,255,255,0.45)', flex: 1 }}>{l.name}</span>
              {lang === l.code && <i className="ri-check-line" style={{ fontSize: 18, color: '#22D3EE' }} />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── REMINDER CRUD POPUP ─── */
export function ReminderCRUDPopup({ show, editReminder, setEditReminder, onClose, reminders, reminderMeta, token, fetchData, deleteReminder }: any) {
  if (!show || !editReminder) return null;
  const popupType = editReminder._type || 'hydration';
  const meta = reminderMeta[popupType] || reminderMeta.hydration;
  const typeRems = reminders.filter((r: any) => r.reminder_type === popupType);
  const editingId = editReminder._editingId || null;
  const editingData = editReminder._editingData || null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.25)', overflowY: 'scroll', WebkitOverflowScrolling: 'touch' } as any}>
      <div style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: '40px 24px 120px', boxSizing: 'border-box' } as any}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 } as any}>
          <div onClick={onClose} style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div>
        </div>
        <div style={{ textAlign: 'center', marginBottom: 24 } as any}>
          <img src={meta.img} alt="" style={{ width: 120, height: 120, objectFit: 'contain', margin: '0 auto 12px', display: 'block', filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.3))' } as any} />
          <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF' }}>{meta.label}</div>
        </div>
        {typeRems.map((r: any) => {
          const isEditing = editingId === r.id;
          const daysStr = (!r.days || r.days.length === 0 || r.days.length === 7) ? 'Tous les jours' : r.days.join(', ').toUpperCase();
          return (
            <div key={r.id} style={{ borderRadius: 18, background: 'rgba(255,255,255,0.04)', border: `1px solid ${isEditing ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.06)'}`, marginBottom: 10, overflow: 'hidden' } as any}>
              {!isEditing ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px' } as any}>
                  <div onClick={() => setEditReminder({ ...editReminder, _editingId: r.id, _editingData: { time: r.time, notes: r.notes || '', days: r.days || ['lun','mar','mer','jeu','ven','sam','dim'] } })} style={{ cursor: 'pointer', flex: 1 } as any}>
                    <div style={{ fontSize: 28, fontWeight: 900, color: '#FFF' }}>{r.time}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{daysStr}{r.notes ? ` \u00b7 ${r.notes}` : ''}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 } as any}>
                    <div onClick={async () => { try { await apiFetch(`/api/reminders/${r.id}/toggle`, { method: 'PUT' }, token); fetchData(); } catch {} }} style={{ width: 44, height: 24, borderRadius: 12, background: r.active ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)', border: `1px solid ${r.active ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.15)'}`, cursor: 'pointer', position: 'relative' } as any}>
                      <div style={{ width: 18, height: 18, borderRadius: 9, background: r.active ? '#10B981' : 'rgba(255,255,255,0.4)', position: 'absolute', top: 2, left: r.active ? 22 : 2, transition: 'left 0.2s' } as any} />
                    </div>
                    <div onClick={async () => { await deleteReminder(r.id); }} style={{ cursor: 'pointer' } as any}><i className="ri-delete-bin-line" style={{ fontSize: 16, color: 'rgba(239,68,68,0.5)' }} /></div>
                  </div>
                </div>
              ) : (
                <div style={{ padding: '16px 18px' } as any}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 }}>Heure</div>
                  <input type="time" value={editingData?.time || ''} onChange={(e: any) => setEditReminder({ ...editReminder, _editingData: { ...editingData, time: e.target.value } })} style={{ width: '100%', padding: '12px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 20, fontWeight: 800, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', marginBottom: 12, colorScheme: 'dark' } as any} />
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 }}>Notes</div>
                  <input value={editingData?.notes || ''} onChange={(e: any) => setEditReminder({ ...editReminder, _editingData: { ...editingData, notes: e.target.value } })} placeholder="Ex: 2 verres d'eau..." style={{ width: '100%', padding: '12px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', marginBottom: 14 } as any} />
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#FFF', marginBottom: 8 }}>Frequence</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, marginBottom: 14 } as any}>
                    {[{ key: 'lun', l: 'L' },{ key: 'mar', l: 'M' },{ key: 'mer', l: 'Me' },{ key: 'jeu', l: 'J' },{ key: 'ven', l: 'V' },{ key: 'sam', l: 'S' },{ key: 'dim', l: 'D' }].map(d => {
                      const sel = (editingData?.days || []).includes(d.key);
                      return <div key={d.key} onClick={() => { const days = editingData?.days || []; setEditReminder({ ...editReminder, _editingData: { ...editingData, days: sel ? days.filter((x: string) => x !== d.key) : [...days, d.key] } }); }} style={{ padding: '10px', borderRadius: 10, background: sel ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.02)', border: `1px solid ${sel ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.05)'}`, cursor: 'pointer', textAlign: 'center', fontSize: 12, fontWeight: sel ? 800 : 500, color: sel ? '#FFF' : 'rgba(255,255,255,0.2)' } as any}>{d.l}</div>;
                    })}
                  </div>
                  <div style={{ display: 'flex', gap: 8 } as any}>
                    <div onClick={async () => { try { await apiFetch(`/api/reminders/${r.id}`, { method: 'PUT', body: JSON.stringify({ ...editingData, reminder_type: popupType, title: editingData.notes || meta.label }) }, token); fetchData(); setEditReminder({ ...editReminder, _editingId: null, _editingData: null, _saved: r.id }); setTimeout(() => setEditReminder((p: any) => ({ ...p, _saved: null })), 2000); } catch {} }} style={{ flex: 1, padding: '12px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#FFF' } as any}>Sauvegarder</div>
                    <div onClick={() => setEditReminder({ ...editReminder, _editingId: null, _editingData: null })} style={{ padding: '12px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)' } as any}>Annuler</div>
                  </div>
                </div>
              )}
              {editReminder._saved === r.id && <div style={{ padding: '8px 18px 12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 } as any}><i className="ri-checkbox-circle-line" style={{ fontSize: 14, color: '#10B981' }} /><span style={{ fontSize: 12, fontWeight: 700, color: '#10B981' }}>Sauvegarde !</span></div>}
            </div>
          );
        })}
        {typeRems.length === 0 && <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 13, color: 'rgba(255,255,255,0.25)' }}>Aucun rappel configure</div>}
        <div onClick={async () => { try { await apiFetch('/api/reminders', { method: 'POST', body: JSON.stringify({ reminder_type: popupType, title: meta.label, time: '08:00', days: ['lun','mar','mer','jeu','ven','sam','dim'], notes: '', active: true }) }, token); fetchData(); } catch {} }} style={{ padding: '14px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 } as any}>
          <i className="ri-add-line" style={{ fontSize: 16, color: '#FFF' }} /><span style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>Ajouter un rappel</span>
        </div>
      </div>
    </div>
  );
}

/* ─── REMINDER NOTIFICATION POPUP ─── */
export function ReminderNotifPopup({ reminderNotif, setReminderNotif, reminderMeta, token, fetchData }: any) {
  if (!reminderNotif) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10000, backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', background: 'rgba(200,190,210,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
      <div style={{ width: '100%', maxWidth: 360, padding: '40px 30px 30px', textAlign: 'center', position: 'relative' } as any}>
        <div onClick={() => setReminderNotif(null)} style={{ position: 'absolute', top: 10, right: 10, width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: '#FFF' }} /></div>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'rgba(255,255,255,0.7)', marginBottom: 4 }}>Rappel</div>
        <div style={{ fontSize: 32, fontWeight: 900, color: '#FFF', marginBottom: 20 }}>{reminderMeta[reminderNotif.reminder_type]?.label || reminderNotif.title}</div>
        <img src={reminderMeta[reminderNotif.reminder_type]?.img || REMINDER_IMAGES.alarm} alt="" style={{ width: 140, height: 140, objectFit: 'contain', margin: '0 auto 16px', display: 'block' } as any} />
        {reminderNotif.notes && <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF', marginBottom: 8 }}>[{reminderNotif.notes}]</div>}
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', marginBottom: 28, fontStyle: 'italic', lineHeight: 1.4 }}>{reminderMeta[reminderNotif.reminder_type]?.question}</div>
        <div onClick={async () => { try { await apiFetch(`/api/reminders/${reminderNotif.id}/complete`, { method: 'PUT' }, token); } catch {} setReminderNotif(null); fetchData(); }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: '14px', borderRadius: 999, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', cursor: 'pointer', marginBottom: 12 } as any}>
          <div style={{ width: 32, height: 32, borderRadius: 999, background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><i className="ri-check-line" style={{ fontSize: 18, color: '#FFF' }} /></div>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#FFF' }}>Confirmer le rappel</span>
        </div>
        <div onClick={() => setReminderNotif(null)} style={{ padding: '12px', borderRadius: 999, border: '2px solid rgba(239,68,68,0.4)', cursor: 'pointer', textAlign: 'center', fontSize: 14, fontWeight: 800, color: '#EF4444', textTransform: 'uppercase', letterSpacing: 1 } as any}>Refuser</div>
      </div>
    </div>
  );
}

/* ─── ADD GUARDIAN POPUP ─── */
export function AddGuardianPopup({ show, onClose, phone, setPhone, relationship, setRelationship, msg, setMsg, loading: isLoading, setLoading: setIsLoading, token, fetchData }: any) {
  if (!show) return null;
  const PROS_G = ['Auxiliaire de vie', 'Aide soignant(e)', 'Aide a domicile', 'Professionnel de sante', 'Infirmier(e) liberale', 'Coach sportif', 'Preparateur physique'];
  const PERSO_G = ['Mere', 'Pere', 'Fils', 'Fille', 'Petit-enfant', 'Conjoint(e)', 'Frere', 'Soeur', 'Ami(e)', 'Voisin(e)', 'Autre'];
  const isPro = PROS_G.includes(relationship);
  const isPerso = PERSO_G.includes(relationship);
  return (
    <div onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(4,14,26,0.6)', overflowY: 'auto' } as any}>
      <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '40px 28px 120px', boxSizing: 'border-box' } as any}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}>
          <div onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)' }} /></div>
        </div>
        <div style={{ marginBottom: 24 } as any}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(79,195,247,0.5)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 6 }}>Beneficiaire &middot; Gardien</div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#FFF', marginBottom: 8, lineHeight: 1.1 }}>Ajouter un<br/>gardien</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>Entrez le numero de telephone de votre gardien.</div>
        </div>
        <div style={{ marginBottom: 24 } as any}>
          <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Numero de telephone</div>
          <input value={phone} onChange={(e: any) => setPhone(e.target.value)} placeholder="06 12 34 56 78" type="tel" style={{ width: '100%', padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 15, fontWeight: 600, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' } as any} />
        </div>
        <div style={{ marginBottom: 24 } as any}>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF', marginBottom: 12 }}>Lien avec le gardien</div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 12 } as any}>
            <div onClick={() => { if (!isPro) setRelationship(PROS_G[0]); }} style={{ flex: 1, padding: '12px', borderRadius: 14, cursor: 'pointer', background: isPro ? 'rgba(79,195,247,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isPro ? 'rgba(79,195,247,0.3)' : 'rgba(255,255,255,0.06)'}`, textAlign: 'center' } as any}>
              <i className="ri-briefcase-line" style={{ fontSize: 20, color: isPro ? '#4FC3F7' : 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 6 }} />
              <div style={{ fontSize: 12, fontWeight: 700, color: isPro ? '#4FC3F7' : 'rgba(255,255,255,0.5)' }}>Professionnel</div>
            </div>
            <div onClick={() => { if (!isPerso) setRelationship(PERSO_G[0]); }} style={{ flex: 1, padding: '12px', borderRadius: 14, cursor: 'pointer', background: isPerso ? 'rgba(79,195,247,0.08)' : 'rgba(255,255,255,0.03)', border: `1px solid ${isPerso ? 'rgba(79,195,247,0.3)' : 'rgba(255,255,255,0.06)'}`, textAlign: 'center' } as any}>
              <i className="ri-heart-line" style={{ fontSize: 20, color: isPerso ? '#4FC3F7' : 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 6 }} />
              <div style={{ fontSize: 12, fontWeight: 700, color: isPerso ? '#4FC3F7' : 'rgba(255,255,255,0.5)' }}>Particulier</div>
            </div>
          </div>
          {(isPro || isPerso) && (
            <select value={relationship} onChange={(e: any) => setRelationship(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 13, fontFamily: 'inherit', outline: 'none', appearance: 'none', cursor: 'pointer' } as any}>
              {(isPro ? PROS_G : PERSO_G).map(r => <option key={r} value={r} style={{ background: '#0a1929', color: '#FFF' }}>{r}</option>)}
            </select>
          )}
        </div>
        {msg && (
          <div style={{ padding: '12px 14px', borderRadius: 12, marginBottom: 14, background: msg.startsWith('Erreur') ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', border: `1px solid ${msg.startsWith('Erreur') ? 'rgba(239,68,68,0.2)' : 'rgba(16,185,129,0.2)'}` } as any}>
            <div style={{ fontSize: 12, color: '#FFF', lineHeight: 1.5 }}>{msg}</div>
          </div>
        )}
        <div onClick={async () => {
          if (!phone.trim() || isLoading) return;
          setIsLoading(true); setMsg('');
          try {
            const res = await apiFetch('/api/beneficiary/invite-guardian', { method: 'POST', body: JSON.stringify({ phone: phone.trim(), relationship: relationship.trim() }) }, token);
            setMsg(res.message || 'Invitation envoyee !');
            if (res.status !== 'error') { fetchData(); setTimeout(onClose, 2000); }
          } catch (e: any) { setMsg(`Erreur : ${(e as any).message}`); } finally { setIsLoading(false); }
        }} style={{ padding: '14px', borderRadius: 12, textAlign: 'center', cursor: phone.trim() ? 'pointer' : 'not-allowed', background: phone.trim() ? 'linear-gradient(135deg, rgba(14,116,144,0.4), rgba(34,211,238,0.2))' : 'rgba(255,255,255,0.03)', border: `1px solid ${phone.trim() ? 'rgba(34,211,238,0.3)' : 'rgba(255,255,255,0.06)'}`, color: phone.trim() ? '#FFF' : 'rgba(255,255,255,0.3)', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 } as any}>
          {isLoading ? 'Envoi...' : <><i className="ri-send-plane-line" style={{ fontSize: 15 }} />Envoyer l'invitation</>}
        </div>
      </div>
    </div>
  );
}

/* ─── DAILY CHECK-IN POPUP ─── */
export function CheckinPopup({ show, onClose, activeProgram, mood, setMood, note, setNote, sending, setSending, feedback, setFeedback, token, fetchData }: any) {
  if (!show || !activeProgram?.active) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10002, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(4,14,26,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
      <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 380, padding: '28px 24px', boxSizing: 'border-box' } as any}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 } as any}>
          <div data-testid="close-checkin" onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
            <i className="ri-close-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }} />
          </div>
        </div>
        {!feedback ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 } as any}>
              <div style={{ fontSize: 28, marginBottom: 8 }}>{activeProgram.program?.icon ? <i className={activeProgram.program.icon} style={{ fontSize: 36, color: activeProgram.program.color }} /> : null}</div>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF', marginBottom: 4 }}>Jour {activeProgram.current_day}</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{activeProgram.today_tasks?.focus}</div>
            </div>
            <div style={{ marginBottom: 20 } as any}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF', marginBottom: 10, textAlign: 'center' }}>Comment te sens-tu ?</div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8 } as any}>
                {[1, 2, 3, 4, 5].map(m => (
                  <div key={m} data-testid={`mood-${m}`} onClick={() => setMood(m)} style={{ width: 48, height: 48, borderRadius: 14, cursor: 'pointer', background: mood === m ? `${['#EF4444','#F59E0B','#A78BFA','#22D3EE','#10B981'][m-1]}20` : 'rgba(255,255,255,0.03)', border: `2px solid ${mood === m ? ['#EF4444','#F59E0B','#A78BFA','#22D3EE','#10B981'][m-1] : 'rgba(255,255,255,0.06)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, transition: 'all 0.2s' } as any}>
                    {['\u{1F614}','\u{1F610}','\u{1F642}','\u{1F60A}','\u{1F604}'][m-1]}
                  </div>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 20 } as any}>
              <input data-testid="checkin-note" value={note} onChange={(e: any) => setNote(e.target.value)} placeholder="Une note sur ta journee... (optionnel)" style={{ width: '100%', padding: '12px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' } as any} />
            </div>
            <div data-testid="submit-checkin" onClick={async () => {
              if (sending) return;
              setSending(true);
              try { const res = await apiFetch('/api/programs/checkin', { method: 'POST', body: JSON.stringify({ mood, note }) }, token); setFeedback(res.feedback || 'Bravo !'); fetchData(); } catch {} finally { setSending(false); }
            }} style={{ padding: '14px', borderRadius: 14, textAlign: 'center', cursor: 'pointer', background: `linear-gradient(135deg, ${activeProgram.program?.color || '#22D3EE'}40, ${activeProgram.program?.color || '#22D3EE'}20)`, border: `1px solid ${activeProgram.program?.color || '#22D3EE'}30`, fontSize: 14, fontWeight: 700, color: '#FFF' } as any}>
              {sending ? 'Envoi...' : 'Valider mon check-in'}
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' } as any}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>{'\u{1F389}'}</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF', marginBottom: 12 }}>Check-in valide !</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: 20, padding: '14px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' } as any}>"{feedback}"</div>
            <div onClick={() => { onClose(); setFeedback(''); setNote(''); setMood(3); }} style={{ padding: '12px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#FFF' } as any}>Fermer</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── GUARDIAN ACTIVATION POPUP ─── */
export function GuardianActivationPopup({ show, onClose, step, setStep, alertSms, setAlertSms, alertEmail, setAlertEmail, activating, onActivate }: any) {
  if (!show) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 10001, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(4,14,26,0.7)', overflowY: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
      <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 400, padding: '32px 24px', boxSizing: 'border-box' } as any}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 } as any}>
          <div data-testid="close-guardian-activation" onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
            <i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)' }} />
          </div>
        </div>
        {step === 0 ? (
          <>
            <div style={{ textAlign: 'center', marginBottom: 28 } as any}>
              <div style={{ width: 72, height: 72, borderRadius: 20, background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(139,92,246,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid rgba(167,139,250,0.2)' } as any}><i className="ri-shield-user-line" style={{ fontSize: 32, color: '#A78BFA' }} /></div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', marginBottom: 8 }}>Devenez Aidant</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>Activez votre espace aidant pour veiller sur vos proches</div>
            </div>
            {[
              { icon: 'ri-eye-line', color: '#22D3EE', title: 'Suivi en temps reel', desc: 'Consultez les donnees de sante et la localisation de vos proches' },
              { icon: 'ri-alarm-warning-line', color: '#EF4444', title: 'Alertes instantanees', desc: 'Recevez les alertes SOS, chutes et anomalies par SMS et email' },
              { icon: 'ri-heart-pulse-line', color: '#10B981', title: 'Rapports de sante', desc: 'Acces aux rapports detailles et recommandations du Coach IA' },
              { icon: 'ri-route-line', color: '#F59E0B', title: 'Interventions coordonnees', desc: 'Participez a la chaine de secours en cas d\'alerte' },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '12px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' } as any}>
                <div style={{ width: 38, height: 38, borderRadius: 12, background: `${f.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className={f.icon} style={{ fontSize: 18, color: f.color }} /></div>
                <div><div style={{ fontSize: 13, fontWeight: 700, color: '#FFF', marginBottom: 2 }}>{f.title}</div><div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.4 }}>{f.desc}</div></div>
              </div>
            ))}
            <div data-testid="guardian-activation-next" onClick={() => setStep(1)} style={{ marginTop: 24, padding: '14px', borderRadius: 14, textAlign: 'center', cursor: 'pointer', background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(139,92,246,0.1))', border: '1px solid rgba(167,139,250,0.25)', fontSize: 14, fontWeight: 700, color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 } as any}>
              <span>Continuer</span><i className="ri-arrow-right-line" style={{ fontSize: 16 }} />
            </div>
          </>
        ) : (
          <>
            <div style={{ textAlign: 'center', marginBottom: 24 } as any}>
              <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF', marginBottom: 6 }}>Configurer vos alertes</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>Choisissez comment recevoir les notifications d'alerte de vos proches</div>
            </div>
            {/* SMS Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 10 } as any}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><i className="ri-message-2-line" style={{ fontSize: 18, color: '#10B981' }} /></div>
                <div><div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>Alertes SMS</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Recevoir les urgences par SMS</div></div>
              </div>
              <div data-testid="toggle-sms" onClick={() => setAlertSms(!alertSms)} style={{ width: 48, height: 26, borderRadius: 13, background: alertSms ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)', border: `1px solid ${alertSms ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.15)'}`, cursor: 'pointer', position: 'relative' } as any}>
                <div style={{ width: 20, height: 20, borderRadius: 10, background: alertSms ? '#10B981' : 'rgba(255,255,255,0.4)', position: 'absolute', top: 2, left: alertSms ? 24 : 2, transition: 'left 0.2s' } as any} />
              </div>
            </div>
            {/* Email Toggle */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 18px', borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 24 } as any}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(56,189,248,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><i className="ri-mail-line" style={{ fontSize: 18, color: '#38BDF8' }} /></div>
                <div><div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>Alertes Email</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Recevoir les rapports par email</div></div>
              </div>
              <div data-testid="toggle-email" onClick={() => setAlertEmail(!alertEmail)} style={{ width: 48, height: 26, borderRadius: 13, background: alertEmail ? 'rgba(56,189,248,0.3)' : 'rgba(255,255,255,0.1)', border: `1px solid ${alertEmail ? 'rgba(56,189,248,0.4)' : 'rgba(255,255,255,0.15)'}`, cursor: 'pointer', position: 'relative' } as any}>
                <div style={{ width: 20, height: 20, borderRadius: 10, background: alertEmail ? '#38BDF8' : 'rgba(255,255,255,0.4)', position: 'absolute', top: 2, left: alertEmail ? 24 : 2, transition: 'left 0.2s' } as any} />
              </div>
            </div>
            <div data-testid="activate-guardian-btn" onClick={onActivate} style={{ padding: '16px', borderRadius: 14, textAlign: 'center', cursor: activating ? 'wait' : 'pointer', background: 'linear-gradient(135deg, rgba(167,139,250,0.25), rgba(139,92,246,0.15))', border: '1px solid rgba(167,139,250,0.3)', boxShadow: '0 4px 20px rgba(139,92,246,0.2)', fontSize: 15, fontWeight: 800, color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 } as any}>
              {activating ? <span>Activation en cours...</span> : <><i className="ri-shield-check-line" style={{ fontSize: 18 }} /><span>Activer l'espace aidant</span></>}
            </div>
            <div onClick={() => setStep(0)} style={{ marginTop: 12, padding: '10px', borderRadius: 10, textAlign: 'center', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.3)' } as any}><i className="ri-arrow-left-line" style={{ marginRight: 4 }} />Retour</div>
          </>
        )}
      </div>
    </div>
  );
}
