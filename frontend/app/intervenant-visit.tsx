import React, { useState, useEffect } from 'react';
import { View, Text, Platform } from 'react-native';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { useRouter, useLocalSearchParams } from 'expo-router';
import NativePageView from '../src/components/NativePageView';

export default function IntervenantVisitScreen() {
  const { user, token } = useAuth();
  const router = useRouter();
  const { beneficiaryId } = useLocalSearchParams<{ beneficiaryId: string }>();
  const [visitData, setVisitData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({ general_state: '', mobility: '', mood: '', appetite: '', pain_level: 0, notes: '', medication_taken: true, alert_doctor: false });

  useEffect(() => {
    if (beneficiaryId) {
      apiFetch(`/api/intervenant/visit/${beneficiaryId}`, {}, token)
        .then(setVisitData).catch(() => {}).finally(() => setLoading(false));
    }
  }, [beneficiaryId]);

  const submitObservation = async () => {
    setSaving(true);
    try {
      await apiFetch(`/api/intervenant/visit/${beneficiaryId}/observation`, {
        method: 'POST', body: JSON.stringify(form),
      }, token);
      setSaved(true);
      setShowForm(false);
    } catch {} finally { setSaving(false); }
  };

  if (Platform.OS !== 'web') return <NativePageView path="/intervenant-visit" />;
  if (loading) return <div style={{ position: 'absolute', inset: 0, background: '#0a0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', color: 'rgba(255,255,255,0.3)' } as any}>Chargement...</div>;
  if (!visitData) return <div style={{ position: 'absolute', inset: 0, background: '#0a0f1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', color: '#EF4444' } as any}>Acces refuse ou beneficiaire introuvable</div>;

  const ben = visitData.beneficiary;
  const v = visitData.vitals;
  const bd = v?.bracelet || {};
  const sd = v?.scale || {};

  const stateOptions = [
    { val: 'bon', label: 'Bon', color: '#10B981', icon: 'ri-emotion-happy-line' },
    { val: 'moyen', label: 'Moyen', color: '#F59E0B', icon: 'ri-emotion-normal-line' },
    { val: 'preoccupant', label: 'Preoccupant', color: '#EF4444', icon: 'ri-emotion-sad-line' },
  ];

  return (
    <div data-testid="intervenant-visit" style={{ position: 'absolute', inset: 0, fontFamily: "'Inter', sans-serif", background: '#0a0f1a', overflowY: 'auto' } as any}>
      <div style={{ maxWidth: 420, margin: '0 auto', padding: '20px 20px 100px' } as any}>
        {/* Back */}
        <div onClick={() => router.back()} style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: 16 } as any}>
          <i className="ri-arrow-left-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 } as any}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg, #0891B2, #06B6D4)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(6,182,212,0.4)' } as any}>
            <span style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>{ben.name?.charAt(0)}</span>
          </div>
          <div style={{ flex: 1 } as any}>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF' }}>{ben.name}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
              {ben.date_of_birth || ''}{ben.medical_conditions ? ` · ${ben.medical_conditions}` : ''}
            </div>
          </div>
          <div style={{ padding: '6px 12px', borderRadius: 99, background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)', fontSize: 10, fontWeight: 700, color: '#06B6D4' }}>Visite</div>
        </div>

        {/* Vitals */}
        <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 8 }}>Constantes (bracelet)</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 16 } as any}>
          {[
            { val: bd.heart_rate, label: 'FC', unit: 'bpm', color: '#EF4444' },
            { val: bd.spo2, label: 'SpO2', unit: '%', color: '#3B82F6' },
            { val: bd.temperature, label: 'Temp', unit: 'C', color: '#F59E0B' },
            { val: bd.blood_pressure?.systolic ? `${bd.blood_pressure.systolic}/${bd.blood_pressure.diastolic}` : null, label: 'Tension', unit: 'mmHg', color: '#A78BFA' },
            { val: bd.steps, label: 'Pas', unit: '', color: '#10B981' },
            { val: bd.stress_level, label: 'Stress', unit: '/100', color: '#8B5CF6' },
          ].map((m, i) => (
            <div key={i} style={{ padding: '12px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' } as any}>
              <div style={{ fontSize: 20, fontWeight: 900, color: m.val ? '#FFF' : 'rgba(255,255,255,0.15)' }}>{m.val || '--'}</div>
              <div style={{ fontSize: 9, color: m.color, fontWeight: 600 }}>{m.label} <span style={{ color: 'rgba(255,255,255,0.25)' }}>{m.unit}</span></div>
            </div>
          ))}
        </div>

        {/* Medical info */}
        <div style={{ padding: '14px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 16 } as any}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Informations medicales</div>
          {[
            { label: 'Pathologies', val: ben.medical_conditions || 'Aucune renseignee' },
            { label: 'Allergies', val: ben.allergies || 'Aucune' },
            { label: 'Medecin', val: ben.doctor_name || 'Non renseigne' },
            { label: 'Adresse', val: ben.address || 'Non renseignee' },
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' } as any}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>{r.label}</span>
              <span style={{ fontSize: 12, color: '#FFF', fontWeight: 600, textAlign: 'right', maxWidth: '60%' }}>{r.val}</span>
            </div>
          ))}
        </div>

        {/* Active program */}
        {visitData.active_program && (
          <div style={{ padding: '12px 16px', borderRadius: 14, background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 } as any}>
            <i className="ri-calendar-check-line" style={{ fontSize: 18, color: '#A78BFA' }} />
            <div><div style={{ fontSize: 12, fontWeight: 700, color: '#FFF' }}>{visitData.active_program.title}</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Jour {visitData.active_program.day}/{visitData.active_program.total}</div></div>
          </div>
        )}

        {/* Medications */}
        {visitData.medications?.length > 0 && (
          <div style={{ marginBottom: 16 } as any}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Traitements</div>
            {visitData.medications.map((m: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' } as any}>
                <i className="ri-capsule-line" style={{ fontSize: 14, color: '#F59E0B' }} />
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{m.title || m.label || 'Traitement'} — {m.time || ''}</span>
              </div>
            ))}
          </div>
        )}

        {/* Recent alerts */}
        {visitData.recent_alerts?.length > 0 && (
          <div style={{ marginBottom: 16 } as any}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(239,68,68,0.6)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Alertes recentes</div>
            {visitData.recent_alerts.slice(0, 3).map((a: any, i: number) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' } as any}>
                <i className="ri-alarm-warning-line" style={{ fontSize: 14, color: '#EF4444' }} />
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{a.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Previous observations */}
        {visitData.previous_observations?.length > 0 && (
          <div style={{ marginBottom: 16 } as any}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Observations precedentes</div>
            {visitData.previous_observations.slice(0, 3).map((o: any, i: number) => (
              <div key={i} style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', marginBottom: 6 } as any}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 } as any}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: o.general_state === 'bon' ? '#10B981' : o.general_state === 'preoccupant' ? '#EF4444' : '#F59E0B' }}>Etat: {o.general_state}</span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>{o.date} — {o.observer_name}</span>
                </div>
                {o.notes && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{o.notes}</div>}
              </div>
            ))}
          </div>
        )}

        {/* Saved confirmation */}
        {saved && (
          <div style={{ padding: '14px', borderRadius: 14, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', marginBottom: 14, textAlign: 'center' } as any}>
            <i className="ri-checkbox-circle-fill" style={{ fontSize: 20, color: '#10B981', display: 'block', marginBottom: 4 }} />
            <div style={{ fontSize: 13, fontWeight: 700, color: '#10B981' }}>Observation enregistree</div>
          </div>
        )}

        {/* Add observation button / form */}
        {!showForm ? (
          <div data-testid="add-observation-btn" onClick={() => setShowForm(true)} style={{ padding: '16px', borderRadius: 16, textAlign: 'center', cursor: 'pointer', background: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(6,182,212,0.08))', border: '1px solid rgba(6,182,212,0.3)', fontSize: 15, fontWeight: 800, color: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 } as any}>
            <i className="ri-add-circle-line" style={{ fontSize: 20 }} />
            Ajouter une observation
          </div>
        ) : (
          <div data-testid="observation-form" style={{ padding: '20px', borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' } as any}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#FFF', marginBottom: 16 }}>Observation de visite</div>

            {/* General state */}
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Etat general</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 } as any}>
              {stateOptions.map(s => (
                <div key={s.val} onClick={() => setForm({ ...form, general_state: s.val })} style={{ flex: 1, padding: '12px 8px', borderRadius: 14, background: form.general_state === s.val ? `${s.color}15` : 'rgba(255,255,255,0.03)', border: `2px solid ${form.general_state === s.val ? s.color : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', textAlign: 'center' } as any}>
                  <i className={s.icon} style={{ fontSize: 22, color: form.general_state === s.val ? s.color : 'rgba(255,255,255,0.2)', display: 'block', marginBottom: 4 }} />
                  <div style={{ fontSize: 11, fontWeight: 600, color: form.general_state === s.val ? s.color : 'rgba(255,255,255,0.3)' }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Pain level */}
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 8 }}>Niveau de douleur</div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 16 } as any}>
              {Array.from({ length: 11 }, (_, i) => i).map(n => (
                <div key={n} onClick={() => setForm({ ...form, pain_level: n })} style={{ flex: 1, height: 36, borderRadius: 8, background: form.pain_level >= n && n > 0 ? `rgba(239,68,68,${0.1 + n * 0.08})` : n === 0 && form.pain_level === 0 ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${form.pain_level === n ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.04)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: form.pain_level === n ? '#FFF' : 'rgba(255,255,255,0.2)' } as any}>{n}</div>
              ))}
            </div>

            {/* Medication taken */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.04)', marginBottom: 8 } as any}>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>Traitement pris</span>
              <div onClick={() => setForm({ ...form, medication_taken: !form.medication_taken })} style={{ width: 44, height: 24, borderRadius: 12, background: form.medication_taken ? '#10B981' : 'rgba(255,255,255,0.1)', cursor: 'pointer', position: 'relative', transition: 'background 0.2s' } as any}>
                <div style={{ position: 'absolute', top: 2, left: form.medication_taken ? 22 : 2, width: 20, height: 20, borderRadius: 10, background: '#FFF', transition: 'left 0.2s' } as any} />
              </div>
            </div>

            {/* Notes */}
            <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>Notes</div>
            <textarea value={form.notes} onChange={(e: any) => setForm({ ...form, notes: e.target.value })} placeholder="Observations, etat du logement, comportement..." rows={3} style={{ width: '100%', padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#FFF', fontSize: 13, fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box', outline: 'none', marginBottom: 12 } as any} />

            {/* Alert doctor */}
            <div onClick={() => setForm({ ...form, alert_doctor: !form.alert_doctor })} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: 12, background: form.alert_doctor ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${form.alert_doctor ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', marginBottom: 16 } as any}>
              <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${form.alert_doctor ? '#EF4444' : 'rgba(255,255,255,0.15)'}`, background: form.alert_doctor ? '#EF4444' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                {form.alert_doctor && <i className="ri-check-line" style={{ fontSize: 14, color: '#FFF' }} />}
              </div>
              <div style={{ flex: 1 } as any}>
                <div style={{ fontSize: 13, fontWeight: 700, color: form.alert_doctor ? '#EF4444' : 'rgba(255,255,255,0.5)' }}>Alerter le medecin traitant</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>Creer une alerte pour {ben.doctor_name || 'le medecin'}</div>
              </div>
            </div>

            {/* Submit */}
            <div onClick={submitObservation} style={{ padding: '16px', borderRadius: 14, textAlign: 'center', cursor: saving ? 'wait' : 'pointer', background: form.general_state ? 'linear-gradient(135deg, rgba(6,182,212,0.3), rgba(6,182,212,0.12))' : 'rgba(255,255,255,0.03)', border: `1px solid ${form.general_state ? 'rgba(6,182,212,0.4)' : 'rgba(255,255,255,0.06)'}`, fontSize: 15, fontWeight: 800, color: form.general_state ? '#FFF' : 'rgba(255,255,255,0.2)' } as any}>
              {saving ? 'Enregistrement...' : 'Enregistrer l\'observation'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
