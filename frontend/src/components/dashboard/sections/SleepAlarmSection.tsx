import React, { useState } from 'react';
import { apiFetch } from '../../../services/api';

export function SleepAlarmSection({ sleepAlarm, alarmTime, setAlarmTime, editingAlarm, setEditingAlarm, setSleepAlarm, token, C, glass, isDark }: any) {
  const [saving, setSaving] = useState(false);
  const s = sleepAlarm || {};
  const adjustments = s.adjustments || [];
  const extraMin = s.extra_minutes || 0;

  const factors = [
    { label: 'Qualite du sommeil', icon: 'ri-moon-clear-fill', color: '#A78BFA', active: adjustments.includes('Sommeil recent insuffisant'), desc: 'Phases profondes et REM' },
    { label: 'Niveau de stress', icon: 'ri-mental-health-line', color: '#F59E0B', active: adjustments.includes('Stress eleve'), desc: 'Cortisol et variabilite cardiaque' },
    { label: 'Recuperation', icon: 'ri-heart-pulse-line', color: '#EF4444', active: adjustments.includes('Recuperation faible'), desc: 'VFC et frequence au repos' },
    { label: 'Activite physique', icon: 'ri-run-line', color: '#10B981', active: adjustments.includes('Activite physique intense'), desc: 'Depense energetique du jour' },
  ];

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const res = await apiFetch('/api/health/sleep-alarm', { method: 'PUT', body: JSON.stringify({ wake_time: alarmTime, enabled: true }) }, token);
      if (res) setSleepAlarm(res);
      setEditingAlarm(false);
    } catch {} finally { setSaving(false); }
  };

  return (
    <>
      {/* Dashboard card */}
      <div data-testid="sleep-alarm-card" className="dash-slide-up" onClick={() => setEditingAlarm(true)} style={{ borderRadius: 18, background: C.card, padding: '16px 20px', marginBottom: 20, cursor: 'pointer', transition: 'transform 0.15s', ...glass } as any}
        onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
        onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 } as any}>
          <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>Sommeil de ce soir</div>
          <i className="ri-arrow-right-s-line" style={{ fontSize: 18, color: C.arrow }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around' } as any}>
          <div style={{ textAlign: 'center' } as any}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' } as any}>
              <i className="ri-moon-clear-fill" style={{ fontSize: 16, color: '#A78BFA' }} />
              <span style={{ fontSize: 26, fontWeight: 900, color: C.text, fontVariantNumeric: 'tabular-nums' } as any}>{s.bedtime || '22:00'}</span>
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, color: C.sub, textTransform: 'uppercase', letterSpacing: 0.8, marginTop: 3 }}>Coucher recommande</div>
          </div>
          <div style={{ width: 36, height: 0, borderTop: `2px dashed ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)'}` } as any} />
          <div style={{ textAlign: 'center' } as any}>
            <span style={{ fontSize: 26, fontWeight: 900, color: C.text, fontVariantNumeric: 'tabular-nums' } as any}>{s.wake_time || alarmTime}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center', marginTop: 3 } as any}>
              <span style={{ width: 5, height: 5, borderRadius: 3, background: '#10B981' } as any} />
              <span style={{ fontSize: 9, fontWeight: 800, color: '#10B981', textTransform: 'uppercase', letterSpacing: 0.5 }}>Alarme activee</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── GLASS POPUP (same style as notification center) ── */}
      {editingAlarm && (
        <div data-testid="sleep-popup" onClick={() => setEditingAlarm(false)} style={{ position: 'fixed', inset: 0, zIndex: 99990, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.78)', overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as any}>
          <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: '24px 20px 40px', boxSizing: 'border-box' } as any}>

            {/* Close button */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}>
              <div onClick={() => setEditingAlarm(false)} style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
                <i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} />
              </div>
            </div>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 28 } as any}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 } as any}>
                <i className="ri-moon-clear-fill" style={{ fontSize: 26, color: '#A78BFA' }} />
              </div>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>Optimisation du sommeil</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 4, lineHeight: 1.5 }}>
                Calculee selon votre physiologie et vos donnees
              </div>
            </div>

            {/* Wake time input */}
            <div style={{ marginBottom: 20 } as any}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Heure de reveil</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 } as any}>
                <select data-testid="wake-hour" value={alarmTime.split(':')[0] || '07'} onChange={(e: any) => setAlarmTime(`${e.target.value}:${alarmTime.split(':')[1] || '00'}`)} style={{ width: 80, padding: '14px 8px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 32, fontWeight: 900, textAlign: 'center', outline: 'none', fontFamily: 'inherit', appearance: 'none', WebkitAppearance: 'none' } as any}>
                  {Array.from({length: 24}, (_, i) => <option key={i} value={String(i).padStart(2, '0')} style={{ background: '#111', color: '#FFF' }}>{String(i).padStart(2, '0')}</option>)}
                </select>
                <span style={{ fontSize: 32, fontWeight: 900, color: 'rgba(255,255,255,0.2)' }}>:</span>
                <select data-testid="wake-minute" value={alarmTime.split(':')[1] || '00'} onChange={(e: any) => setAlarmTime(`${alarmTime.split(':')[0] || '07'}:${e.target.value}`)} style={{ width: 80, padding: '14px 8px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 32, fontWeight: 900, textAlign: 'center', outline: 'none', fontFamily: 'inherit', appearance: 'none', WebkitAppearance: 'none' } as any}>
                  {Array.from({length: 12}, (_, i) => <option key={i} value={String(i * 5).padStart(2, '0')} style={{ background: '#111', color: '#FFF' }}>{String(i * 5).padStart(2, '0')}</option>)}
                </select>
              </div>
            </div>

            {/* Computed bedtime — glass card */}
            <div style={{ background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.12)', borderRadius: 18, padding: '18px 20px', marginBottom: 24, textAlign: 'center' } as any}>
              <div style={{ fontSize: 9, fontWeight: 700, color: '#A78BFA', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>Coucher recommande</div>
              <div style={{ fontSize: 36, fontWeight: 900, color: '#FFF', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{s.bedtime || '22:00'}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 8 }}>
                {(s.sleep_need_hours || 7)}h{(s.sleep_need_minutes || 30) > 0 ? `${s.sleep_need_minutes || 30}min` : ''} de sommeil recommandees
                {extraMin > 0 && <span style={{ color: '#F59E0B' }}> (+{extraMin}min)</span>}
              </div>
            </div>

            {/* Science factors */}
            <div style={{ marginBottom: 24 } as any}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>Facteurs d'analyse</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 } as any}>
                {factors.map((f, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: `1px solid ${f.color}25` } as any}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: `${f.color}15`, border: `1px solid ${f.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                      <i className={f.icon} style={{ fontSize: 15, color: f.color }} />
                    </div>
                    <div style={{ flex: 1 } as any}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{f.label}</div>
                      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>{f.desc}</div>
                    </div>
                    {f.active && <div style={{ width: 8, height: 8, borderRadius: 4, background: f.color, flexShrink: 0, boxShadow: `0 0 6px ${f.color}60` } as any} />}
                  </div>
                ))}
              </div>
            </div>

            {/* Explanation */}
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', lineHeight: 1.6, textAlign: 'center', marginBottom: 24, padding: '0 8px' }}>
              Notre algorithme analyse votre variabilite cardiaque, frequence au repos, stress et qualite des phases de sommeil profond pour determiner votre besoin reel de recuperation.
            </div>

            {/* Save button */}
            <div data-testid="save-alarm-btn" onClick={handleSave} style={{ padding: '16px', borderRadius: 999, background: '#FFF', textAlign: 'center', cursor: 'pointer', fontSize: 15, fontWeight: 800, color: '#111', opacity: saving ? 0.5 : 1, transition: 'opacity 0.15s', marginBottom: 80 } as any}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
