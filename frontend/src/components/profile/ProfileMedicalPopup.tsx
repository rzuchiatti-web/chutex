import { useI18n } from '../../context/I18nContext';
import React from 'react';
import { Platform } from 'react-native';

const portalMount = (node: React.ReactNode) => {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const ReactDOM = require('react-dom');
    return ReactDOM.createPortal(node, document.body);
  }
  return node;
};
const POP: any = { position: 'fixed', inset: 0, zIndex: 99990, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.55)', overflowY: 'scroll', WebkitOverflowScrolling: 'touch' };

const CONDITION_LIST = ['Diabete', 'Hypertension', 'Cholesterol', 'Arthrose', 'Insuffisance cardiaque', 'AVC', 'Asthme', 'Osteoporose', 'Parkinson', 'Alzheimer', 'Depression', 'Hemophilie', 'Epilepsie', 'Aucune'];
const ALLERGY_LIST = ['Penicilline', 'Aspirine', 'Latex', 'Iode', 'Pollen', 'Acariens', 'Gluten', 'Lactose', 'Aucune'];

interface Props {
  visible: boolean;
  onClose: () => void;
  medForm: any;
  setMedForm: (f: any) => void;
  medSaving: boolean;
  setMedSaving: (v: boolean) => void;
  medSaved: boolean;
  setMedSaved: (v: boolean) => void;
  apiFetch: any;
  token: string;
}

export function ProfileMedicalPopup({ visible, onClose, medForm, setMedForm, medSaving, setMedSaving, medSaved, setMedSaved, apiFetch, token }: Props) {
  if (!visible || Platform.OS !== 'web') return null;

  return portalMount(
    <div style={POP as any}>
      <div style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: '70px 28px 120px', boxSizing: 'border-box' } as any}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}>
          <div data-testid="medical-popup-close" onClick={onClose} style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div>
        </div>
        <div style={{ textAlign: 'center', marginBottom: 24 } as any}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 } as any}>
            <i className="ri-heart-pulse-line" style={{ fontSize: 28, color: '#EF4444' }} />
          </div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF' }}>Dossier medical</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>Modifiez vos informations medicales</div>
        </div>

        {/* Blood type */}
        <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Groupe sanguin</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 } as any}>
          {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bt => (
            <div key={bt} data-testid={`blood-type-${bt}`} onClick={() => setMedForm({ ...medForm, blood_type: bt })} style={{ padding: '8px 14px', borderRadius: 999, background: medForm.blood_type === bt ? 'rgba(239,68,68,0.15)' : 'rgba(255,255,255,0.03)', border: `1px solid ${medForm.blood_type === bt ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', fontSize: 13, fontWeight: 700, color: medForm.blood_type === bt ? '#FCA5A5' : 'rgba(255,255,255,0.35)' } as any}>{bt}</div>
          ))}
        </div>

        {/* Conditions */}
        <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Pathologies</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 } as any}>
          {CONDITION_LIST.map(c => (
            <div key={c} data-testid={`condition-${c}`} onClick={() => {
              if (c === t('none_female')) setMedForm({ ...medForm, conditions: [t('none_female')] });
              else setMedForm({ ...medForm, conditions: medForm.conditions.includes(c) ? medForm.conditions.filter((x: string) => x !== c) : [...medForm.conditions.filter((x: string) => x !== t('none_female')), c] });
            }} style={{ padding: '8px 12px', borderRadius: 999, background: medForm.conditions.includes(c) ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${medForm.conditions.includes(c) ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: medForm.conditions.includes(c) ? '#FFF' : 'rgba(255,255,255,0.35)' } as any}>{c}</div>
          ))}
        </div>

        {/* Allergies */}
        <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Allergies</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 } as any}>
          {ALLERGY_LIST.map(a => (
            <div key={a} onClick={() => { if (a === t('none_female')) setMedForm({ ...medForm, allergies: [t('none_female')] }); else setMedForm({ ...medForm, allergies: medForm.allergies.includes(a) ? medForm.allergies.filter((x: string) => x !== a) : [...medForm.allergies.filter((x: string) => x !== t('none_female')), a] }); }} style={{ padding: '10px 12px', borderRadius: 12, background: medForm.allergies.includes(a) ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${medForm.allergies.includes(a) ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 } as any}>
              <div style={{ width: 18, height: 18, borderRadius: 5, background: medForm.allergies.includes(a) ? '#10B981' : 'rgba(255,255,255,0.06)', border: `1px solid ${medForm.allergies.includes(a) ? '#10B981' : 'rgba(255,255,255,0.15)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                {medForm.allergies.includes(a) && <i className="ri-check-line" style={{ fontSize: 11, color: '#FFF' }} />}
              </div>
              <span style={{ fontSize: 12, color: medForm.allergies.includes(a) ? '#FFF' : 'rgba(255,255,255,0.35)' }}>{a}</span>
            </div>
          ))}
        </div>

        {/* Pacemaker / Stents / Thyroid */}
        {[
          { key: 'pacemaker', label: 'Portez-vous un pacemaker ?' },
          { key: 'stents', label: 'Avez-vous des stents ?' },
          { key: 'thyroid', label: 'Probleme de thyroide ?' },
        ].map(q => (
          <div key={q.key} style={{ marginBottom: 14 } as any}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF', marginBottom: 8 }}>{q.label}</div>
            <div style={{ display: 'flex', gap: 8 } as any}>
              {['oui', 'non'].map(v => (
                <div key={v} onClick={() => setMedForm({ ...medForm, [q.key]: v })} style={{ flex: 1, padding: '12px', borderRadius: 14, background: (medForm as any)[q.key] === v ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${(medForm as any)[q.key] === v ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', textAlign: 'center', fontSize: 13, fontWeight: 700, color: (medForm as any)[q.key] === v ? '#FFF' : 'rgba(255,255,255,0.35)' } as any}>{v === 'oui' ? 'Oui' : 'Non'}</div>
              ))}
            </div>
          </div>
        ))}

        {/* Surgeries */}
        <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF', marginBottom: 8, marginTop: 4 }}>Operations chirurgicales</div>
        {(medForm.surgeries || []).map((s: any, idx: number) => (
          <div key={idx} style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 8 } as any}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 } as any}>
              <span style={{ fontSize: 11, fontWeight: 700, color: '#FFF' }}>Operation {idx + 1}</span>
              <div onClick={() => setMedForm({ ...medForm, surgeries: (medForm.surgeries || []).filter((_: any, i: number) => i !== idx) })} style={{ cursor: 'pointer', fontSize: 11, color: '#EF4444', fontWeight: 700 } as any}>Supprimer</div>
            </div>
            <input placeholder="Zone operee (ex: genou droit)" value={s.zone} onChange={(e: any) => { const arr = [...(medForm.surgeries || [])]; arr[idx] = { ...arr[idx], zone: e.target.value }; setMedForm({ ...medForm, surgeries: arr }); }}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', marginBottom: 6 } as any} />
            <input placeholder="Date (ex: Mars 2022)" value={s.date} onChange={(e: any) => { const arr = [...(medForm.surgeries || [])]; arr[idx] = { ...arr[idx], date: e.target.value }; setMedForm({ ...medForm, surgeries: arr }); }}
              style={{ width: '100%', padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' } as any} />
          </div>
        ))}
        <div onClick={() => setMedForm({ ...medForm, surgeries: [...(medForm.surgeries || []), { zone: '', date: '' }] })} style={{ padding: '12px', borderRadius: 999, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 14 } as any}>
          <i className="ri-add-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Ajouter une operation</span>
        </div>

        {/* Save */}
        {medSaved && <div style={{ padding: '10px 14px', borderRadius: 999, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 } as any}><i className="ri-checkbox-circle-line" style={{ fontSize: 16, color: '#10B981' }} /><span style={{ fontSize: 13, fontWeight: 700, color: '#10B981' }}>Sauvegarde !</span></div>}
        <div data-testid="medical-save-btn" onClick={async () => {
          setMedSaving(true);
          try {
            await apiFetch('/api/auth/update-profile', { method: 'PUT', body: JSON.stringify({
              blood_type: medForm.blood_type, medical_conditions: medForm.conditions.join(', '),
              allergies: medForm.allergies.join(', '), pacemaker: medForm.pacemaker,
              stents: medForm.stents, thyroid: medForm.thyroid,
            }) }, token);
            setMedSaved(true); setTimeout(() => setMedSaved(false), 3000);
          } catch {} finally { setMedSaving(false); }
        }} style={{ padding: '16px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#FFF', opacity: medSaving ? 0.6 : 1 } as any}>{medSaving ? 'Sauvegarde...' : 'Sauvegarder'}</div>
      </div>
    </div>
  );
}
