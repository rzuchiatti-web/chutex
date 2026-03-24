import React, { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { apiFetch, clearApiCache } from '../../services/api';
import { REMINDER_IMAGES } from './constants';
import { PhoneInputWithPrefix } from '../PhoneInputWithPrefix';

const portalMount = (node: React.ReactNode) => {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const ReactDOM = require('react-dom');
    return ReactDOM.createPortal(node, document.body);
  }
  return node;
};

const OVERLAY: any = { position: 'fixed', inset: 0, zIndex: 99990, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.55)', overflowY: 'auto' };
const OVERLAY_CENTER: any = { ...OVERLAY, display: 'flex', alignItems: 'center', justifyContent: 'center' };

/* ─── NOTIFICATIONS POPUP ─── */
export function NotificationsPopup({ show, onClose, activeAlerts, guardianRequests, predictiveAlerts, token, onRefresh }: any) {
  const router = useRouter();
  const [processing, setProcessing] = useState<string | null>(null);
  if (!show) return null;

  const handleAccept = async (reqId: string) => {
    setProcessing(reqId);
    try {
      await apiFetch(`/api/beneficiary/guardian-requests/${reqId}/accept`, { method: 'POST' }, token);
      if (onRefresh) onRefresh();
    } catch {} finally { setProcessing(null); }
  };
  const handleReject = async (reqId: string) => {
    setProcessing(reqId);
    try {
      await apiFetch(`/api/beneficiary/guardian-requests/${reqId}/reject`, { method: 'POST' }, token);
      if (onRefresh) onRefresh();
    } catch {} finally { setProcessing(null); }
  };

  const pAlerts = predictiveAlerts || [];

  return portalMount(
    <div onClick={onClose} style={OVERLAY as any}>
      <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '40px 24px 120px', boxSizing: 'border-box' } as any}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}>
          <div onClick={onClose} style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div>
        </div>
        <div style={{ textAlign: 'center', marginBottom: 24 } as any}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 } as any}><i className="ri-notification-3-line" style={{ fontSize: 26, color: 'rgba(255,255,255,0.6)' }} /></div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>Notifications</div>
        </div>
        {activeAlerts.length === 0 && guardianRequests.length === 0 && pAlerts.length === 0 && <div style={{ textAlign: 'center', padding: '20px 0', fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>Aucune notification pour le moment.</div>}

        {/* Predictive alerts from Nora */}
        {pAlerts.map((a: any) => (
          <div key={a.id} data-testid={`predictive-alert-${a.id}`} style={{ padding: '14px 16px', borderRadius: 16, background: a.severity === 'warning' ? 'rgba(245,158,11,0.08)' : 'rgba(139,92,246,0.06)', border: `1px solid ${a.severity === 'warning' ? 'rgba(245,158,11,0.2)' : 'rgba(139,92,246,0.15)'}`, marginBottom: 8, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } as any}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 } as any}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: `${a.color || '#F59E0B'}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                <i className={a.icon || 'ri-pulse-line'} style={{ fontSize: 16, color: a.color || '#F59E0B' }} />
              </div>
              <div style={{ flex: 1 } as any}>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#FFF' }}>{a.title}</div>
              </div>
              <div onClick={async (e: any) => { e.stopPropagation(); try { await apiFetch(`/api/nora/predictive-alerts/${a.id}/dismiss`, { method: 'POST' }, token); if (onRefresh) onRefresh(); } catch {} }} style={{ width: 24, height: 24, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any} data-testid={`dismiss-alert-${a.id}`}>
                <i className="ri-close-line" style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }} />
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{a.message}</div>
            {a.recommendation && <div style={{ fontSize: 11, color: a.color || '#F59E0B', fontWeight: 600, marginTop: 4 }}>{a.recommendation}</div>}
          </div>
        ))}

        {activeAlerts.map((a: any) => (
          <div key={a.id} onClick={() => { onClose(); router.push({ pathname: '/alert-detail', params: { alertId: a.id } }); }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', borderRadius: 16, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', marginBottom: 8, cursor: 'pointer' } as any}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className="ri-alarm-warning-line" style={{ fontSize: 18, color: '#EF4444' }} /></div>
            <div style={{ flex: 1 } as any}><div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{a.message}</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Alerte active</div></div>
            <i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.2)' }} />
          </div>
        ))}
        {guardianRequests.map((r: any) => (
          <div key={r.id} style={{ padding: '16px', borderRadius: 16, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', marginBottom: 8 } as any}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 } as any}>
              <div style={{ width: 40, height: 40, borderRadius: 999, background: 'rgba(167,139,250,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><span style={{ fontSize: 16, fontWeight: 800, color: '#A78BFA' }}>{(r.guardian_name || '?').charAt(0)}</span></div>
              <div style={{ flex: 1 } as any}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{r.guardian_name || 'Demande gardien'}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{r.relationship || r.type === 'particular' ? 'Particulier' : 'Professionnel'} - Demande de rattachement</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 } as any}>
              <div onClick={() => handleAccept(r.id)} style={{ flex: 1, padding: '11px', borderRadius: 999, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.2)', cursor: processing === r.id ? 'wait' : 'pointer', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#10B981' } as any}>{processing === r.id ? '...' : 'Accepter'}</div>
              <div onClick={() => handleReject(r.id)} style={{ flex: 1, padding: '11px', borderRadius: 999, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', cursor: processing === r.id ? 'wait' : 'pointer', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#EF4444' } as any}>{processing === r.id ? '...' : 'Refuser'}</div>
            </div>
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
  return portalMount(
    <div onClick={onClose} style={OVERLAY as any}>
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
export function ReminderCRUDPopup({ show, editReminder, setEditReminder, onClose, reminders, reminderMeta, token, fetchData, deleteReminder, setReminders, onCrudDone }: any) {
  // Local state: the popup owns its own copy of reminders for instant UI updates
  const [localReminders, setLocalReminders] = useState<any[]>(reminders || []);
  const mountedRef = useRef(true);

  // Sync from parent props whenever they change (background refresh, initial load)
  useEffect(() => {
    setLocalReminders(reminders || []);
  }, [reminders]);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  // Direct fetch: the popup refreshes its own data, bypassing parent render timing
  const refreshLocal = async () => {
    try {
      clearApiCache();
      const batch = await apiFetch('/api/dashboard/batch', {}, token);
      if (batch && mountedRef.current) {
        const fresh = Array.isArray(batch.reminders) ? batch.reminders : [];
        setLocalReminders(fresh);
        // Also sync parent state in background (no dependency on this for UI)
        if (setReminders) setReminders(fresh);
      }
    } catch {}
  };

  if (!show || !editReminder) return null;
  const popupType = editReminder._type || 'hydration';
  const meta = reminderMeta[popupType] || reminderMeta.hydration;
  const typeRems = localReminders.filter((r: any) => r.reminder_type === popupType);
  const editingId = editReminder._editingId || null;
  const editingData = editReminder._editingData || null;
  const colors: Record<string, string> = { hydration: '#38BDF8', medication: '#F59E0B', alarm: '#EF4444' };
  const accent = colors[popupType] || '#38BDF8';

  const setTime = (h: number, m: number) => setEditReminder({ ...editReminder, _editingData: { ...editingData, time: `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}` } });
  const hr = editingData ? parseInt((editingData.time || '08:00').split(':')[0]) || 8 : 8;
  const mn = editingData ? parseInt((editingData.time || '08:00').split(':')[1]) || 0 : 0;

  return (
    <div style={{ ...OVERLAY, overflowY: 'scroll', WebkitOverflowScrolling: 'touch' } as any}>
      <div style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: '24px 20px 120px', boxSizing: 'border-box' } as any}>

        {/* Close button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 } as any}>
          <div data-testid="reminder-popup-close" onClick={onClose} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
            <i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)' }} />
          </div>
        </div>

        {/* Big image */}
        <div style={{ textAlign: 'center', marginBottom: 20 } as any}>
          <img src={meta.img} alt="" style={{ width: 160, height: 160, objectFit: 'contain', margin: '0 auto', display: 'block', filter: 'drop-shadow(0 12px 32px rgba(0,0,0,0.4))' } as any} />
        </div>

        {/* Edit mode */}
        {editingId ? (
          <div style={{ borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', overflow: 'hidden' } as any}>

            {/* Scroll time picker */}
            <div style={{ padding: '20px', borderBottom: '1px solid rgba(255,255,255,0.06)' } as any}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14, textAlign: 'center' }}>Heure du rappel</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 } as any}>
                {/* Hours scroll */}
                <div style={{ width: 70, height: 150, overflow: 'hidden', position: 'relative', borderRadius: 14 } as any}>
                  <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 44, marginTop: -22, borderTop: `1px solid ${accent}40`, borderBottom: `1px solid ${accent}40`, zIndex: 1, pointerEvents: 'none' } as any} />
                  <div data-testid="hour-scroll" style={{ height: '100%', overflowY: 'scroll', scrollSnapType: 'y mandatory', scrollbarWidth: 'none', position: 'relative', zIndex: 3, paddingTop: 53, paddingBottom: 53 } as any}
                    ref={(el: any) => { if (el && !el._scrolled) { el.scrollTop = hr * 44; el._scrolled = true; } }}
                    onScroll={(e: any) => { const idx = Math.round(e.target.scrollTop / 44); if (idx >= 0 && idx < 24) setTime(idx, mn); }}>
                    {Array.from({ length: 24 }, (_, i) => (
                      <div key={i} style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', scrollSnapAlign: 'center', fontSize: i === hr ? 34 : 20, fontWeight: i === hr ? 900 : 400, color: i === hr ? '#FFF' : 'rgba(255,255,255,0.12)', transition: 'all 0.15s' } as any}>{String(i).padStart(2, '0')}</div>
                    ))}
                  </div>
                </div>
                <span style={{ fontSize: 36, fontWeight: 900, color: 'rgba(255,255,255,0.15)' }}>:</span>
                {/* Minutes scroll */}
                <div style={{ width: 70, height: 150, overflow: 'hidden', position: 'relative', borderRadius: 14 } as any}>
                  <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 44, marginTop: -22, borderTop: `1px solid ${accent}40`, borderBottom: `1px solid ${accent}40`, zIndex: 1, pointerEvents: 'none' } as any} />
                  <div data-testid="minute-scroll" style={{ height: '100%', overflowY: 'scroll', scrollSnapType: 'y mandatory', scrollbarWidth: 'none', position: 'relative', zIndex: 3, paddingTop: 53, paddingBottom: 53 } as any}
                    ref={(el: any) => { if (el && !el._scrolled) { el.scrollTop = mn * 44; el._scrolled = true; } }}
                    onScroll={(e: any) => { const idx = Math.round(e.target.scrollTop / 44); if (idx >= 0 && idx < 60) setTime(hr, idx); }}>
                    {Array.from({ length: 60 }, (_, i) => (
                      <div key={i} style={{ height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center', scrollSnapAlign: 'center', fontSize: i === mn ? 34 : 20, fontWeight: i === mn ? 900 : 400, color: i === mn ? '#FFF' : 'rgba(255,255,255,0.12)', transition: 'all 0.15s' } as any}>{String(i).padStart(2, '0')}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Days */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' } as any}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Jours</div>
              <div style={{ display: 'flex', gap: 6 } as any}>
                {[{ key: 'lun', l: 'L' },{ key: 'mar', l: 'M' },{ key: 'mer', l: 'Me' },{ key: 'jeu', l: 'J' },{ key: 'ven', l: 'V' },{ key: 'sam', l: 'S' },{ key: 'dim', l: 'D' }].map(d => {
                  const sel = (editingData?.days || []).includes(d.key);
                  return <div key={d.key} onClick={() => { const days = editingData?.days || []; setEditReminder({ ...editReminder, _editingData: { ...editingData, days: sel ? days.filter((x: string) => x !== d.key) : [...days, d.key] } }); }} style={{ flex: 1, padding: '10px 0', borderRadius: 12, background: sel ? `${accent}20` : 'rgba(255,255,255,0.03)', border: `1.5px solid ${sel ? accent : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', textAlign: 'center', fontSize: 12, fontWeight: sel ? 800 : 500, color: sel ? accent : 'rgba(255,255,255,0.25)', transition: 'all 0.15s' } as any}>{d.l}</div>;
                })}
              </div>
            </div>

            {/* Note */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' } as any}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Note (optionnel)</div>
              <input value={editingData?.notes || ''} onChange={(e: any) => setEditReminder({ ...editReminder, _editingData: { ...editingData, notes: e.target.value } })} placeholder="Ex: 2 verres d'eau..." style={{ width: '100%', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#FFF', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' } as any} />
            </div>

            {/* Actions */}
            <div style={{ padding: '16px 20px', display: 'flex', gap: 10 } as any}>
              <div data-testid="save-reminder-btn" onClick={async () => {
                const r = typeRems.find((r: any) => r.id === editingId);
                if (!r) return;
                try {
                  await apiFetch(`/api/reminders/${r.id}`, { method: 'PUT', body: JSON.stringify({ ...editingData, reminder_type: popupType, title: editingData.notes || meta.label }) }, token);
                  setEditReminder({ ...editReminder, _editingId: null, _editingData: null });
                  await refreshLocal();
                  if (onCrudDone) onCrudDone(popupType);
                } catch {}
              }} style={{ flex: 1, padding: '14px', borderRadius: 999, background: accent, cursor: 'pointer', textAlign: 'center', fontSize: 14, fontWeight: 800, color: '#FFF' } as any}>Sauvegarder</div>
              <div onClick={() => setEditReminder({ ...editReminder, _editingId: null, _editingData: null })} style={{ padding: '14px 20px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.4)' } as any}>Annuler</div>
            </div>
          </div>
        ) : (
          <>
            {/* Reminder list */}
            {typeRems.map((r: any) => {
              const daysStr = (!r.days || r.days.length === 0 || r.days.length === 7) ? 'Tous les jours' : r.days.join(', ').toUpperCase();
              return (
                <div key={r.id} data-testid={`reminder-item-${r.id}`} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', marginBottom: 8 } as any}>
                  {/* Time + info — click to edit */}
                  <div onClick={() => setEditReminder({ ...editReminder, _editingId: r.id, _editingData: { time: r.time, notes: r.notes || '', days: r.days || ['lun','mar','mer','jeu','ven','sam','dim'] } })} style={{ flex: 1, cursor: 'pointer' } as any}>
                    <div style={{ fontSize: 24, fontWeight: 900, color: r.active ? '#FFF' : 'rgba(255,255,255,0.25)' }}>{r.time}</div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{daysStr}{r.notes ? ` · ${r.notes}` : ''}</div>
                  </div>
                  {/* Toggle */}
                  <div data-testid={`toggle-reminder-${r.id}`} onClick={async () => {
                    // Optimistic toggle
                    setLocalReminders(prev => prev.map(rem => rem.id === r.id ? { ...rem, active: !rem.active } : rem));
                    try {
                      await apiFetch(`/api/reminders/${r.id}/toggle`, { method: 'PUT' }, token);
                      await refreshLocal();
                      if (onCrudDone) onCrudDone(popupType);
                    } catch { await refreshLocal(); }
                  }} style={{ width: 48, height: 26, borderRadius: 13, background: r.active ? `${accent}40` : 'rgba(255,255,255,0.08)', border: `1px solid ${r.active ? accent : 'rgba(255,255,255,0.12)'}`, cursor: 'pointer', position: 'relative', flexShrink: 0, transition: 'all 0.2s' } as any}>
                    <div style={{ width: 20, height: 20, borderRadius: 10, background: r.active ? accent : 'rgba(255,255,255,0.3)', position: 'absolute', top: 2, left: r.active ? 24 : 2, transition: 'left 0.2s' } as any} />
                  </div>
                  {/* Delete */}
                  <div data-testid={`delete-reminder-${r.id}`} onClick={async () => {
                    // Optimistic delete: remove from local immediately
                    setLocalReminders(prev => prev.filter(rem => rem.id !== r.id));
                    try {
                      await apiFetch(`/api/reminders/${r.id}`, { method: 'DELETE' }, token);
                      clearApiCache();
                      await refreshLocal();
                      if (onCrudDone) onCrudDone(popupType);
                    } catch { await refreshLocal(); }
                  }} style={{ cursor: 'pointer', padding: '6px' } as any}>
                    <i className="ri-delete-bin-line" style={{ fontSize: 16, color: 'rgba(239,68,68,0.4)' }} />
                  </div>
                </div>
              );
            })}

            {typeRems.length === 0 && (
              <div style={{ textAlign: 'center', padding: '30px 20px', borderRadius: 16, background: 'rgba(255,255,255,0.04)', marginBottom: 8 } as any}>
                <img src={meta.img} alt="" style={{ width: 64, height: 64, objectFit: 'contain', margin: '0 auto 12px', display: 'block', opacity: 0.5 } as any} />
                <div style={{ fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.3)' }}>Aucun rappel configure</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', marginTop: 4 }}>Ajoutez votre premier rappel</div>
              </div>
            )}

            {/* Add button */}
            <div data-testid="add-reminder-btn" onClick={async () => {
              try {
                await apiFetch('/api/reminders', { method: 'POST', body: JSON.stringify({ reminder_type: popupType, title: meta.label, time: '08:00', days: ['lun','mar','mer','jeu','ven','sam','dim'], notes: '', active: true }) }, token);
                // Directly refresh local state — no dependency on parent re-render
                await refreshLocal();
                if (onCrudDone) onCrudDone(popupType);
              } catch (err: any) { console.error('[REM] Error adding reminder:', err?.message || err); }
            }} style={{ padding: '14px', borderRadius: 999, background: `${accent}15`, border: `1px solid ${accent}30`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4, transition: 'background 0.15s' } as any}
              onMouseEnter={(e: any) => { e.currentTarget.style.background = `${accent}25`; }}
              onMouseLeave={(e: any) => { e.currentTarget.style.background = `${accent}15`; }}>
              <i className="ri-add-line" style={{ fontSize: 18, color: accent }} />
              <span style={{ fontSize: 14, fontWeight: 700, color: accent }}>Ajouter un rappel</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── REMINDER NOTIFICATION POPUP ─── */
export function ReminderNotifPopup({ reminderNotif, setReminderNotif, reminderMeta, token, fetchData }: any) {
  if (!reminderNotif) return null;
  const meta = reminderMeta[reminderNotif.reminder_type] || reminderMeta.hydration;
  return portalMount(
    <div style={OVERLAY_CENTER as any}>
      <div style={{ width: '100%', maxWidth: 340, padding: '0 20px', boxSizing: 'border-box' } as any}>
        <div style={{ borderRadius: 24, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '28px 24px', textAlign: 'center' } as any}>
          <img src={meta.img} alt="" style={{ width: 80, height: 80, objectFit: 'contain', margin: '0 auto 16px', display: 'block' } as any} />
          <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Rappel</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', marginBottom: 6 }}>{meta.label}</div>
          {reminderNotif.notes && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 6 }}>{reminderNotif.notes}</div>}
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 24, lineHeight: 1.5 }}>{meta.question}</div>
          <div onClick={async () => { try { await apiFetch(`/api/reminders/${reminderNotif.id}/complete`, { method: 'PUT' }, token); } catch {} clearApiCache(/dashboard/); setReminderNotif(null); }} style={{ padding: '14px', borderRadius: 999, background: '#10B981', cursor: 'pointer', fontSize: 15, fontWeight: 800, color: '#FFF', marginBottom: 10 } as any}>
            Confirmer
          </div>
          <div onClick={() => setReminderNotif(null)} style={{ padding: '12px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)' } as any}>Plus tard</div>
        </div>
      </div>
    </div>
  );
}

/* ─── ADD GUARDIAN POPUP ─── */
export function AddGuardianPopup({ show, onClose, phone, setPhone, relationship, setRelationship, msg, setMsg, loading: isLoading, setLoading: setIsLoading, token, fetchData }: any) {
  const [phonePrefix, setPhonePrefix] = useState('+33');
  if (!show) return null;
  const PROS_G = ['Auxiliaire de vie', 'Aide soignant(e)', 'Aide a domicile', 'Professionnel de sante', 'Infirmier(e) liberale', 'Coach sportif', 'Preparateur physique'];
  const PERSO_G = ['Mere', 'Pere', 'Fils', 'Fille', 'Petit-enfant', 'Conjoint(e)', 'Frere', 'Soeur', 'Ami(e)', 'Voisin(e)', 'Autre'];
  const isPro = PROS_G.includes(relationship);
  const isPerso = PERSO_G.includes(relationship);
  return portalMount(
    <div onClick={onClose} style={OVERLAY as any}>
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
          <PhoneInputWithPrefix value={phone} onChangeText={setPhone} prefix={phonePrefix} onPrefixChange={setPhonePrefix} placeholder="6 12 34 56 78" />
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
          const phoneClean = phone.trim().replace(/[\s.\-]/g, '');
          if (phoneClean.length < 10) { setMsg('Erreur : Numero invalide (min 10 chiffres)'); return; }
          setIsLoading(true); setMsg('');
          try {
            const res = await apiFetch('/api/beneficiary/invite-guardian', { method: 'POST', body: JSON.stringify({ phone: phone.trim(), relationship: relationship.trim() }) }, token);
            setMsg(res.message || 'Invitation envoyee !');
            if (res.status !== 'error') { fetchData(); setTimeout(onClose, 2500); }
          } catch (e: any) { setMsg(`Erreur : ${(e as any).message}`); } finally { setIsLoading(false); }
        }} style={{ padding: '14px', borderRadius: 999, textAlign: 'center', cursor: phone.trim() ? 'pointer' : 'not-allowed', background: phone.trim() ? 'linear-gradient(135deg, rgba(14,116,144,0.4), rgba(34,211,238,0.2))' : 'rgba(255,255,255,0.03)', border: `1px solid ${phone.trim() ? 'rgba(34,211,238,0.3)' : 'rgba(255,255,255,0.06)'}`, color: phone.trim() ? '#FFF' : 'rgba(255,255,255,0.3)', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 } as any}>
          {isLoading ? 'Envoi...' : <><i className="ri-send-plane-line" style={{ fontSize: 15 }} />Envoyer l'invitation</>}
        </div>
      </div>
    </div>
  );
}

/* ─── DAILY CHECK-IN POPUP ─── */
export function CheckinPopup({ show, onClose, activeProgram, mood, setMood, note, setNote, sending, setSending, feedback, setFeedback, token, fetchData }: any) {
  if (!show || !activeProgram?.active) return null;
  return portalMount(
    <div style={OVERLAY_CENTER as any}>
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
            }} style={{ padding: '14px', borderRadius: 999, textAlign: 'center', cursor: 'pointer', background: `linear-gradient(135deg, ${activeProgram.program?.color || '#22D3EE'}40, ${activeProgram.program?.color || '#22D3EE'}20)`, border: `1px solid ${activeProgram.program?.color || '#22D3EE'}30`, fontSize: 14, fontWeight: 700, color: '#FFF' } as any}>
              {sending ? 'Envoi...' : 'Valider mon check-in'}
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' } as any}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>{'\u{1F389}'}</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF', marginBottom: 12 }}>Check-in valide !</div>
            <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5, marginBottom: 20, padding: '14px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' } as any}>"{feedback}"</div>
            <div onClick={() => { onClose(); setFeedback(''); setNote(''); setMood(3); }} style={{ padding: '12px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#FFF' } as any}>Fermer</div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── GUARDIAN ACTIVATION POPUP ─── */
export function GuardianActivationPopup({ show, onClose, step, setStep, alertSms, setAlertSms, alertEmail, setAlertEmail, activating, onActivate }: any) {
  if (!show) return null;
  return portalMount(
    <div style={{ ...OVERLAY_CENTER, overflowY: 'auto' } as any}>
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
            <div data-testid="guardian-activation-next" onClick={() => setStep(1)} style={{ marginTop: 24, padding: '14px', borderRadius: 999, textAlign: 'center', cursor: 'pointer', background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(139,92,246,0.1))', border: '1px solid rgba(167,139,250,0.25)', fontSize: 14, fontWeight: 700, color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 } as any}>
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
            <div data-testid="activate-guardian-btn" onClick={onActivate} style={{ padding: '16px', borderRadius: 999, textAlign: 'center', cursor: activating ? 'wait' : 'pointer', background: 'linear-gradient(135deg, rgba(167,139,250,0.25), rgba(139,92,246,0.15))', border: '1px solid rgba(167,139,250,0.3)', boxShadow: '0 4px 20px rgba(139,92,246,0.2)', fontSize: 15, fontWeight: 800, color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 } as any}>
              {activating ? <span>Activation en cours...</span> : <><i className="ri-shield-check-line" style={{ fontSize: 18 }} /><span>Activer l'espace aidant</span></>}
            </div>
            <div onClick={() => setStep(0)} style={{ marginTop: 12, padding: '10px', borderRadius: 10, textAlign: 'center', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'rgba(255,255,255,0.3)' } as any}><i className="ri-arrow-left-line" style={{ marginRight: 4 }} />Retour</div>
          </>
        )}
      </div>
    </div>
  );
}
