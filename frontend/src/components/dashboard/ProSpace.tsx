import React, { useState, useEffect, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { apiFetch } from '../../services/api';
import FullScreenLoader from '../FullScreenLoader';

const C = {
  bg: '#0A0A12', card: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.06)',
  text: '#FFF', sub: 'rgba(255,255,255,0.5)', muted: 'rgba(255,255,255,0.25)',
  accent: '#3B82F6', green: '#10B981', amber: '#F59E0B', red: '#EF4444',
};

const CATEGORIES = [
  { key: 'general', label: 'General', icon: 'ri-file-list-3-line' },
  { key: 'rehab', label: 'Reeducation', icon: 'ri-heart-add-line' },
  { key: 'strength', label: 'Renforcement', icon: 'ri-boxing-line' },
  { key: 'cardio', label: 'Cardio', icon: 'ri-run-line' },
  { key: 'flexibility', label: 'Souplesse', icon: 'ri-body-scan-line' },
];

function ProgramCard({ program, onPress, onDelete }: any) {
  const sessionCount = (program.sessions || []).length;
  const cat = CATEGORIES.find(c => c.key === program.category) || CATEGORIES[0];
  return (
    <div data-testid={`program-card-${program.id}`} onClick={onPress} style={{
      padding: '18px', borderRadius: 18, background: C.card, border: `1px solid ${C.border}`,
      cursor: 'pointer', marginBottom: 8, transition: 'background 0.15s',
    } as any}
      onMouseEnter={(e: any) => e.currentTarget.style.background = 'rgba(255,255,255,0.07)'}
      onMouseLeave={(e: any) => e.currentTarget.style.background = C.card}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 } as any}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
          <i className={cat.icon} style={{ fontSize: 20, color: C.accent }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{program.title}</div>
          <div style={{ fontSize: 11, color: C.sub, marginTop: 2 }}>{program.beneficiary_name}</div>
          <div style={{ display: 'flex', gap: 10, marginTop: 6 } as any}>
            <span style={{ fontSize: 10, color: C.muted }}><i className="ri-calendar-line" style={{ fontSize: 10, marginRight: 3 }} />{program.frequency || '--'}</span>
            <span style={{ fontSize: 10, color: C.muted }}><i className="ri-time-line" style={{ fontSize: 10, marginRight: 3 }} />{program.duration_weeks} sem.</span>
            <span style={{ fontSize: 10, color: C.green }}><i className="ri-file-list-3-line" style={{ fontSize: 10, marginRight: 3 }} />{sessionCount} seance{sessionCount > 1 ? 's' : ''}</span>
          </div>
        </div>
        <div onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(239,68,68,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 } as any}>
          <i className="ri-delete-bin-line" style={{ fontSize: 14, color: C.red }} />
        </div>
      </div>
    </div>
  );
}

export default function ProSpace({ token, user }: { token: string; user: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [programs, setPrograms] = useState<any[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', frequency: '3x/semaine', duration_weeks: 4, category: 'general', beneficiary_id: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [progs, bens] = await Promise.all([
        apiFetch('/api/pro/programs', {}, token),
        apiFetch('/api/pro/beneficiaries', {}, token),
      ]);
      setPrograms(progs);
      setBeneficiaries(bens);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const createProgram = async () => {
    if (!form.title || !form.beneficiary_id) return;
    setSaving(true);
    try {
      await apiFetch(`/api/pro/programs/${form.beneficiary_id}`, {
        method: 'POST', body: JSON.stringify({ title: form.title, description: form.description, frequency: form.frequency, duration_weeks: form.duration_weeks, category: form.category }),
      }, token);
      setShowCreate(false);
      setForm({ title: '', description: '', frequency: '3x/semaine', duration_weeks: 4, category: 'general', beneficiary_id: '' });
      fetchData();
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setSaving(false); }
  };

  const deleteProgram = async (id: string) => {
    try {
      await apiFetch(`/api/pro/programs/edit/${id}`, { method: 'DELETE' }, token);
      fetchData();
    } catch (e: any) { Alert.alert('Erreur', e.message); }
  };

  if (loading) return <FullScreenLoader />;
  if (Platform.OS !== 'web') return null;

  return (
    <div data-testid="pro-space" style={{ position: 'absolute', inset: 0, background: C.bg, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif' } as any}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', flexShrink: 0 } as any}>
        <div>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>Mes programmes</div>
          <div style={{ fontSize: 12, color: C.sub }}>{programs.length} programme{programs.length > 1 ? 's' : ''}</div>
        </div>
        <div data-testid="create-program-btn" onClick={() => setShowCreate(true)} style={{
          padding: '10px 18px', borderRadius: 999, background: C.accent, cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6,
        } as any}>
          <i className="ri-add-line" style={{ fontSize: 16, color: '#FFF' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>Nouveau</span>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 120px', WebkitOverflowScrolling: 'touch' } as any}>
        {programs.length === 0 ? (
          <div style={{ padding: '50px 20px', textAlign: 'center', borderRadius: 18, background: C.card, border: `1px solid ${C.border}` } as any}>
            <i className="ri-file-add-line" style={{ fontSize: 36, color: C.muted, marginBottom: 12, display: 'block' }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: C.sub }}>Aucun programme</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Creez votre premier programme pour un patient</div>
          </div>
        ) : (
          programs.map((p) => (
            <ProgramCard key={p.id} program={p} onPress={() => router.push({ pathname: '/pro-program-detail' as any, params: { id: p.id } })} onDelete={() => deleteProgram(p.id)} />
          ))
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div data-testid="create-program-modal" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' } as any} onClick={() => setShowCreate(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{
            width: '100%', maxWidth: 420, maxHeight: '85vh', overflowY: 'auto',
            background: '#14141F', borderRadius: '24px 24px 0 0', padding: '24px 20px 32px',
          } as any}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 } as any}>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>Nouveau programme</div>
              <div onClick={() => setShowCreate(false)} style={{ width: 36, height: 36, borderRadius: 12, background: C.card, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
                <i className="ri-close-line" style={{ fontSize: 18, color: C.sub }} />
              </div>
            </div>

            {/* Patient select */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 } as any}>Patient</label>
              <select data-testid="program-beneficiary-select" value={form.beneficiary_id} onChange={(e) => setForm({ ...form, beneficiary_id: e.target.value })}
                style={{ width: '100%', padding: '12px 14px', borderRadius: 14, background: C.card, border: `1px solid ${C.border}`, color: C.text, fontSize: 14, outline: 'none' } as any}>
                <option value="">Selectionner un patient</option>
                {beneficiaries.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>

            {/* Title */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 } as any}>Titre</label>
              <input data-testid="program-title-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ex: Renforcement lombaire"
                style={{ width: '100%', padding: '12px 14px', borderRadius: 14, background: C.card, border: `1px solid ${C.border}`, color: C.text, fontSize: 14, outline: 'none' } as any} />
            </div>

            {/* Description */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 } as any}>Description</label>
              <textarea data-testid="program-desc-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Objectifs du programme..."
                style={{ width: '100%', padding: '12px 14px', borderRadius: 14, background: C.card, border: `1px solid ${C.border}`, color: C.text, fontSize: 14, outline: 'none', minHeight: 80, resize: 'vertical' } as any} />
            </div>

            {/* Category pills */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 8 } as any}>Categorie</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 } as any}>
                {CATEGORIES.map((cat) => {
                  const sel = form.category === cat.key;
                  return (
                    <div key={cat.key} data-testid={`category-${cat.key}`} onClick={() => setForm({ ...form, category: cat.key })}
                      style={{ padding: '7px 14px', borderRadius: 999, cursor: 'pointer', fontSize: 12, fontWeight: 600,
                        background: sel ? 'rgba(59,130,246,0.15)' : C.card, border: `1px solid ${sel ? 'rgba(59,130,246,0.3)' : C.border}`, color: sel ? C.accent : C.sub,
                    } as any}>
                      <i className={cat.icon} style={{ fontSize: 12, marginRight: 4 }} />{cat.label}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Frequency + Duration row */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 20 } as any}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 } as any}>Frequence</label>
                <input value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} placeholder="3x/semaine"
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 14, background: C.card, border: `1px solid ${C.border}`, color: C.text, fontSize: 14, outline: 'none' } as any} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', marginBottom: 6 } as any}>Duree (semaines)</label>
                <input type="number" value={form.duration_weeks} onChange={(e) => setForm({ ...form, duration_weeks: parseInt(e.target.value) || 1 })}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 14, background: C.card, border: `1px solid ${C.border}`, color: C.text, fontSize: 14, outline: 'none' } as any} />
              </div>
            </div>

            {/* Submit */}
            <div data-testid="submit-program-btn" onClick={saving ? undefined : createProgram}
              style={{ padding: '16px', borderRadius: 999, textAlign: 'center', cursor: saving ? 'wait' : 'pointer',
                background: (form.title && form.beneficiary_id) ? C.accent : C.card,
                color: (form.title && form.beneficiary_id) ? '#FFF' : C.muted,
                fontSize: 15, fontWeight: 800, opacity: saving ? 0.6 : 1, transition: 'all 0.2s',
            } as any}>
              {saving ? 'Creation...' : 'Creer le programme'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
