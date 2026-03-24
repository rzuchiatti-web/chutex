import React, { useState } from 'react';
import { Platform, Alert } from 'react-native';

const portalMount = (node: React.ReactNode) => {
  if (Platform.OS === 'web' && typeof document !== 'undefined') {
    const ReactDOM = require('react-dom');
    return ReactDOM.createPortal(node, document.body);
  }
  return node;
};
const POP: any = { position: 'fixed', inset: 0, zIndex: 99990, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.55)', overflowY: 'scroll', WebkitOverflowScrolling: 'touch' };

interface Props {
  show: boolean;
  onClose: () => void;
  user: any;
  apiFetch: any;
  token: string;
  refreshUser: () => Promise<void>;
}

export function ProfileBenActivation({ show, onClose, user, apiFetch, token, refreshUser }: Props) {
  const [benStep, setBenStep] = useState(1);
  const [benError, setBenError] = useState('');
  const [benSaving, setBenSaving] = useState(false);
  const [benForm, setBenForm] = useState<any>({
    firstName: user.name?.split(' ').slice(1).join(' ') || '',
    lastName: user.name?.split(' ')[0] || '',
    dob_day: user.date_of_birth ? new Date(user.date_of_birth).getDate().toString() : '',
    dob_month: user.date_of_birth ? (new Date(user.date_of_birth).getMonth() + 1).toString() : '',
    dob_year: user.date_of_birth ? new Date(user.date_of_birth).getFullYear().toString() : '',
    gender: user.gender || '', height_cm: user.height_cm || '', weight_kg: user.weight_kg || '',
    address: user.address || '', postal_code: user.postal_code || '', city: user.city || '',
    emergency_name: user.emergency_contact_name || '', emergency_phone: user.emergency_contact_phone || '',
    blood_type: user.blood_type || '', medical_conditions: [] as string[], allergies: [] as string[],
    other_condition: '', had_avc: '', pacemaker: '', stents: '', thyroid: '',
    had_surgery: '', surgeries: [] as any[], family_history: [] as string[],
  });

  if (!show) return null;

  const uf = (k: string, v: any) => setBenForm({ ...benForm, [k]: v });
  const toggleArr = (k: string, v: string) => { const arr = benForm[k] || []; setBenForm({ ...benForm, [k]: arr.includes(v) ? arr.filter((x: string) => x !== v) : [...arr.filter((x: string) => x !== 'Aucune' && x !== 'Aucun'), v] }); };
  const IST: any = { width: '100%', padding: '13px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: '#FFF', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' };
  const LBL: any = { fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 };
  const GLASS: any = { borderRadius: 22, background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '18px 16px', marginBottom: 16 };
  const Chip = ({ label, sel, click }: any) => <div onClick={click} style={{ padding: '8px 14px', borderRadius: 999, background: sel ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.05)', border: `1px solid ${sel ? 'rgba(59,130,246,0.4)' : 'rgba(255,255,255,0.1)'}`, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: sel ? '#60A5FA' : 'rgba(255,255,255,0.5)' } as any}>{label}</div>;
  const YN = ({ label, val, set }: any) => <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' } as any}><span style={{ fontSize: 13, color: '#FFF', flex: 1 }}>{label}</span><div style={{ display: 'flex', gap: 6 } as any}>{['oui','non'].map(v => <div key={v} onClick={() => set(v)} style={{ padding: '6px 14px', borderRadius: 999, background: val === v ? (v === 'oui' ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)') : 'rgba(255,255,255,0.05)', border: `1px solid ${val === v ? (v === 'oui' ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)') : 'rgba(255,255,255,0.08)'}`, cursor: 'pointer', fontSize: 11, fontWeight: 700, color: val === v ? '#FFF' : 'rgba(255,255,255,0.4)' } as any}>{v === 'oui' ? 'Oui' : 'Non'}</div>)}</div></div>;

  const handleClose = () => { onClose(); setBenStep(1); setBenError(''); };

  return portalMount(
    <div style={POP as any}>
      <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '40px 28px 120px', boxSizing: 'border-box' } as any}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 } as any}>
          {benStep > 1 ? <div onClick={() => { setBenStep(benStep - 1); setBenError(''); }} style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-left-s-line" style={{ fontSize: 18, color: '#FFF' }} /></div> : <div />}
          <div style={{ display: 'flex', gap: 6 } as any}>{[1,2,3].map(s => <div key={s} style={{ width: 8, height: 8, borderRadius: 4, background: benStep >= s ? '#3B82F6' : 'rgba(255,255,255,0.15)' } as any} />)}</div>
          <div data-testid="ben-activation-close" onClick={handleClose} style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div>
        </div>
        {benError && <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', marginBottom: 14, fontSize: 12, color: '#FCA5A5' } as any}>{benError}</div>}

        {/* STEP 1: Personal info */}
        {benStep === 1 && (<>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#FFF', marginBottom: 6 }}>Informations personnelles</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 20 }}>Pour personnaliser votre suivi sante</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 } as any}>
            <div style={{ marginBottom: 12 } as any}><div style={LBL}>Prenom *</div><input value={benForm.firstName} onChange={(e: any) => uf('firstName', e.target.value)} placeholder="Jean" style={IST} /></div>
            <div style={{ marginBottom: 12 } as any}><div style={LBL}>Nom *</div><input value={benForm.lastName} onChange={(e: any) => uf('lastName', e.target.value)} placeholder="Dupont" style={IST} /></div>
          </div>
          <div style={LBL}>Date de naissance *</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr 1fr', gap: 8, marginBottom: 12 } as any}>
            <select value={benForm.dob_day} onChange={(e: any) => uf('dob_day', e.target.value)} style={{ ...IST, appearance: 'none', cursor: 'pointer', colorScheme: 'dark' }}><option value="">Jour</option>{Array.from({ length: 31 }, (_, i) => i + 1).map(d => <option key={d} value={String(d)}>{d}</option>)}</select>
            <select value={benForm.dob_month} onChange={(e: any) => uf('dob_month', e.target.value)} style={{ ...IST, appearance: 'none', cursor: 'pointer', colorScheme: 'dark' }}><option value="">Mois</option>{['Janvier','Fevrier','Mars','Avril','Mai','Juin','Juillet','Aout','Septembre','Octobre','Novembre','Decembre'].map((m, i) => <option key={i} value={String(i + 1)}>{m}</option>)}</select>
            <select value={benForm.dob_year} onChange={(e: any) => uf('dob_year', e.target.value)} style={{ ...IST, appearance: 'none', cursor: 'pointer', colorScheme: 'dark' }}><option value="">Annee</option>{Array.from({ length: 100 }, (_, i) => 2026 - i).map(y => <option key={y} value={String(y)}>{y}</option>)}</select>
          </div>
          <div style={LBL}>Sexe *</div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 } as any}>
            {[{ v: 'male', l: 'Homme', ic: 'ri-men-line' }, { v: 'female', l: 'Femme', ic: 'ri-women-line' }].map(g => (
              <div key={g.v} onClick={() => uf('gender', g.v)} style={{ flex: 1, padding: '14px', borderRadius: 999, background: benForm.gender === g.v ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.2)', border: `1px solid ${benForm.gender === g.v ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)'}`, cursor: 'pointer', textAlign: 'center' } as any}>
                <i className={g.ic} style={{ fontSize: 22, color: benForm.gender === g.v ? '#FFF' : 'rgba(255,255,255,0.4)', display: 'block', marginBottom: 4 }} /><div style={{ fontSize: 12, fontWeight: 700, color: benForm.gender === g.v ? '#FFF' : 'rgba(255,255,255,0.5)' }}>{g.l}</div>
              </div>))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 } as any}>
            <div style={{ marginBottom: 12 } as any}><div style={LBL}>Taille</div><select value={benForm.height_cm} onChange={(e: any) => uf('height_cm', e.target.value)} style={{ ...IST, appearance: 'none', cursor: 'pointer', colorScheme: 'dark' }}><option value="">cm</option>{Array.from({ length: 61 }, (_, i) => 140 + i).map(h => <option key={h} value={String(h)}>{h} cm</option>)}</select></div>
            <div style={{ marginBottom: 12 } as any}><div style={LBL}>Poids</div><select value={benForm.weight_kg} onChange={(e: any) => uf('weight_kg', e.target.value)} style={{ ...IST, appearance: 'none', cursor: 'pointer', colorScheme: 'dark' }}><option value="">kg</option>{Array.from({ length: 121 }, (_, i) => 30 + i).map(w => <option key={w} value={String(w)}>{w} kg</option>)}</select></div>
          </div>
          <div style={{ marginBottom: 12 } as any}><div style={LBL}>Adresse</div><input value={benForm.address} onChange={(e: any) => uf('address', e.target.value)} placeholder="12 rue de la Paix" style={IST} /></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 } as any}>
            <div><div style={LBL}>Code postal</div><input value={benForm.postal_code} onChange={(e: any) => uf('postal_code', e.target.value)} placeholder="75002" style={IST} /></div>
            <div><div style={LBL}>Ville</div><input value={benForm.city} onChange={(e: any) => uf('city', e.target.value)} placeholder="Paris" style={IST} /></div>
          </div>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '8px 0 14px' } as any} />
          <div style={LBL}>Contact d'urgence</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 } as any}>
            <div><input value={benForm.emergency_name} onChange={(e: any) => uf('emergency_name', e.target.value)} placeholder="Nom" style={IST} /></div>
            <div><input value={benForm.emergency_phone} onChange={(e: any) => uf('emergency_phone', e.target.value)} placeholder="Telephone" type="tel" style={IST} /></div>
          </div>
          <div data-testid="ben-step1-continue" onClick={() => { if (!benForm.firstName.trim() || !benForm.lastName.trim()) { setBenError('Prenom et nom obligatoires'); return; } if (!benForm.dob_day || !benForm.dob_month || !benForm.dob_year) { setBenError('Date de naissance obligatoire'); return; } if (!benForm.gender) { setBenError('Sexe obligatoire'); return; } setBenError(''); setBenStep(2); }} style={{ padding: '17px', borderRadius: 999, background: '#FFF', color: '#111', cursor: 'pointer', textAlign: 'center', fontSize: 16, fontWeight: 800, boxShadow: '0 4px 14px rgba(255,255,255,0.15)' } as any}>Continuer</div>
        </>)}

        {/* STEP 2: Medical records */}
        {benStep === 2 && (<>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#FFF', marginBottom: 6 }}>Dossier medical</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 20 }}>Informations confidentielles pour votre suivi</div>
          <div style={GLASS}><div style={{ ...LBL, marginBottom: 10 }}>Groupe sanguin</div><select value={benForm.blood_type} onChange={(e: any) => uf('blood_type', e.target.value)} style={{ ...IST, appearance: 'none', cursor: 'pointer', colorScheme: 'dark' }}><option value="">Selectionner</option>{['A+','A-','B+','B-','AB+','AB-','O+','O-','Je ne sais pas'].map(bt => <option key={bt} value={bt}>{bt}</option>)}</select></div>
          <div style={GLASS}><div style={{ ...LBL, marginBottom: 10 }}>Pathologies / Antecedents</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 } as any}>{['Diabete','Hypertension','Cholesterol','Arthrose','Insuffisance cardiaque','AVC','Asthme','Osteoporose','Parkinson','Alzheimer','Depression','Aucune'].map(c => <Chip key={c} label={c} sel={benForm.medical_conditions.includes(c)} click={() => { if (c === 'Aucune') uf('medical_conditions', ['Aucune']); else toggleArr('medical_conditions', c); }} />)}</div></div>
          <div style={GLASS}><div style={{ ...LBL, marginBottom: 10 }}>Allergies</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 } as any}>{['Penicilline','Aspirine','Latex','Arachides','Gluten','Lactose','Iode','Aucune'].map(a => <Chip key={a} label={a} sel={benForm.allergies.includes(a)} click={() => { if (a === 'Aucune') uf('allergies', ['Aucune']); else toggleArr('allergies', a); }} />)}</div></div>
          <div style={GLASS}><div style={{ ...LBL, marginBottom: 10 }}>Questions medicales</div><YN label="Avez-vous deja fait un AVC ?" val={benForm.had_avc} set={(v: string) => uf('had_avc', v)} /><YN label="Portez-vous un pacemaker ?" val={benForm.pacemaker} set={(v: string) => uf('pacemaker', v)} /><YN label="Avez-vous des stents ?" val={benForm.stents} set={(v: string) => uf('stents', v)} /><YN label="Probleme de thyroide ?" val={benForm.thyroid} set={(v: string) => uf('thyroid', v)} /></div>
          <div data-testid="ben-step2-continue" onClick={() => { setBenError(''); setBenStep(3); }} style={{ padding: '17px', borderRadius: 999, background: '#FFF', color: '#111', cursor: 'pointer', textAlign: 'center', fontSize: 16, fontWeight: 800, boxShadow: '0 4px 14px rgba(255,255,255,0.15)' } as any}>Continuer</div>
        </>)}

        {/* STEP 3: Antecedents + Submit */}
        {benStep === 3 && (<>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#FFF', marginBottom: 6 }}>Antecedents</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 20 }}>Derniere etape avant l'activation</div>
          <div style={GLASS}><div style={{ ...LBL, marginBottom: 10 }}>Operations chirurgicales</div><div style={{ display: 'flex', gap: 8, marginBottom: 10 } as any}>{['oui','non'].map(v => <div key={v} onClick={() => { uf('had_surgery', v); if (v === 'oui' && benForm.surgeries.length === 0) uf('surgeries', [{ zone: '', date: '' }]); }} style={{ flex: 1, padding: '12px', borderRadius: 999, background: benForm.had_surgery === v ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.2)', border: `1px solid ${benForm.had_surgery === v ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)'}`, cursor: 'pointer', textAlign: 'center', fontSize: 13, fontWeight: 700, color: benForm.had_surgery === v ? '#FFF' : 'rgba(255,255,255,0.5)' } as any}>{v === 'oui' ? 'Oui' : 'Non'}</div>)}</div>{benForm.had_surgery === 'oui' && benForm.surgeries.map((s: any, idx: number) => <div key={idx} style={{ padding: '12px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 8 } as any}><div style={LBL}>Zone operee</div><input value={s.zone} onChange={(e: any) => { const arr = [...benForm.surgeries]; arr[idx] = { ...arr[idx], zone: e.target.value }; uf('surgeries', arr); }} placeholder="Ex: genou, hanche..." style={IST} /></div>)}</div>
          <div style={GLASS}><div style={{ ...LBL, marginBottom: 10 }}>Antecedents familiaux</div><div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 } as any}>{['Diabete','Hypertension','Maladie cardiaque','AVC','Cancer','Alzheimer','Parkinson','Aucun'].map(f => <Chip key={f} label={f} sel={benForm.family_history.includes(f)} click={() => { if (f === 'Aucun') uf('family_history', ['Aucun']); else toggleArr('family_history', f); }} />)}</div></div>
          <div data-testid="ben-activate-btn" onClick={async () => {
            setBenSaving(true); setBenError('');
            try {
              const dob = `${benForm.dob_year}-${String(benForm.dob_month).padStart(2,'0')}-${String(benForm.dob_day).padStart(2,'0')}`;
              await apiFetch('/api/auth/activate-beneficiary', { method: 'POST', body: JSON.stringify({
                name: `${benForm.lastName} ${benForm.firstName}`.trim(), date_of_birth: dob, gender: benForm.gender,
                height_cm: benForm.height_cm, weight_kg: benForm.weight_kg, address: benForm.address,
                postal_code: benForm.postal_code, city: benForm.city,
                emergency_contact_name: benForm.emergency_name, emergency_contact_phone: benForm.emergency_phone,
                blood_type: benForm.blood_type, medical_conditions: benForm.medical_conditions.join(', '),
                allergies: benForm.allergies.join(', '), had_avc: benForm.had_avc, pacemaker: benForm.pacemaker,
                stents: benForm.stents, thyroid: benForm.thyroid, other_condition: benForm.other_condition,
                surgeries: benForm.surgeries, family_history: benForm.family_history,
              }) }, token);
              await apiFetch('/api/auth/switch-role', { method: 'POST', body: JSON.stringify({ role: 'beneficiary' }) }, token);
              await refreshUser(); handleClose();
            } catch (e: any) { setBenError(e.message || 'Erreur'); } finally { setBenSaving(false); }
          }} style={{ padding: '17px', borderRadius: 999, background: benSaving ? 'rgba(255,255,255,0.2)' : '#FFF', color: benSaving ? 'rgba(0,0,0,0.4)' : '#111', cursor: benSaving ? 'wait' : 'pointer', textAlign: 'center', fontSize: 16, fontWeight: 800, opacity: benSaving ? 0.5 : 1, boxShadow: '0 4px 14px rgba(255,255,255,0.15)' } as any}>{benSaving ? 'Activation...' : 'Activer mon espace beneficiaire'}</div>
        </>)}
      </div>
    </div>
  );
}
