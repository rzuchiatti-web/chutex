import React, { useState, useRef } from 'react';
import { Platform, View, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

const API = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const COACH_COLOR = '#DC2626';
const PHYSIO_COLOR = '#F97316';
const C = { bg: '#FFFFFF', card: '#F4F4F5', border: '#E4E4E7', text: '#18181B', muted: '#71717A', light: '#A1A1AA', white: '#FFF', pill: 999, r: 16, font: "'Inter', system-ui, sans-serif" };
const inp: any = { width: '100%', padding: '13px 16px', borderRadius: 12, background: '#FFF', border: `1.5px solid ${C.border}`, color: C.text, fontSize: 15, fontFamily: C.font, boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.2s' };
const lbl: any = { fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 5, display: 'block', letterSpacing: 0.8, textTransform: 'uppercase' };
const req: any = { color: COACH_COLOR, marginLeft: 2 };
const sel: any = { ...inp, appearance: 'none', WebkitAppearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2371717A' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' };

const SITUATIONS = ['Independant / Liberal', 'Salarie en salle de sport', 'Salarie en clinique', 'Auto-entrepreneur', 'Autre'];
const SPECIALISATIONS_COACH = ['Preparation physique', 'Fitness & Bien-etre', 'Reeducation sportive', 'Coaching senior', 'Perte de poids', 'Autre'];
const SPECIALISATIONS_PHYSIO = ['Kinesitherapeute', 'Osteopathe', 'Reeducation fonctionnelle', 'Reeducation neurologique', 'Geriatrie', 'Autre'];

interface ProFormData {
  first_name: string; last_name: string; phone: string; email: string;
  city: string; postal_code: string; diploma: string; diploma_year: string;
  specialization: string; adeli_rpps: string; siret: string;
  current_situation: string; current_clients: number; motivation: string;
}

const EMPTY: ProFormData = {
  first_name: '', last_name: '', phone: '', email: '',
  city: '', postal_code: '', diploma: '', diploma_year: '',
  specialization: '', adeli_rpps: '', siret: '',
  current_situation: '', current_clients: 0, motivation: '',
};

export default function BecomeProPage() {
  const params = useLocalSearchParams();
  const proType = (params.type as string) || 'coach';
  const isPhysio = proType === 'physio';
  const router = useRouter();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<ProFormData>(EMPTY);
  const [contractText, setContractText] = useState('');
  const [contractAccepted, setContractAccepted] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const TITLE = isPhysio ? 'Devenir Kinesitherapeute Partenaire' : 'Devenir Coach Sportif Partenaire';
  const SUBTITLE = isPhysio
    ? 'Rejoignez le réseau Chutex et accompagnez les bénéficiaires dans leur rééducation physique.'
    : 'Rejoignez le réseau Chutex et accompagnez les bénéficiaires dans leur activité sportive.';
  const SPECS = isPhysio ? SPECIALISATIONS_PHYSIO : SPECIALISATIONS_COACH;
  const AC = isPhysio ? PHYSIO_COLOR : COACH_COLOR;
  const AC_LIGHT = isPhysio ? '#FDBA74' : '#FCA5A5';
  const AC_GRADIENT = isPhysio ? `linear-gradient(135deg, ${PHYSIO_COLOR} 0%, #FB923C 100%)` : `linear-gradient(135deg, ${COACH_COLOR} 0%, #EF4444 100%)`;

  const upd = (k: keyof ProFormData, v: any) => setForm({ ...form, [k]: v });

  // Canvas signature handlers
  const startDraw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };
  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#18181B';
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
    setHasSignature(true);
  };
  const stopDraw = () => setIsDrawing(false);
  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const fetchContract = async () => {
    try {
      const r = await fetch(`${API}/api/pro/application/contract/${proType}`);
      const d = await r.json();
      setContractText(d.contract_text || '');
    } catch { setContractText('Impossible de charger le contrat. Veuillez reessayer.'); }
  };

  const submitApplication = async () => {
    setError('');
    setSaving(true);
    try {
      const body = {
        type: proType,
        ...form,
        signer_name: signerName,
        contract_accepted: contractAccepted,
      };
      const r = await fetch(`${API}/api/pro/application`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) { setError(d.detail || 'Erreur'); setSaving(false); return; }
      setSuccess(d.message || 'Candidature envoyee !');
      setStep(4);
    } catch (e: any) { setError(e.message); }
    finally { setSaving(false); }
  };

  if (Platform.OS !== 'web') return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>Disponible uniquement sur le web</Text></View>;

  const STEPS = ['Informations', 'Diplomes & Experience', 'Contrat & Signature'];
  const canAdvance1 = form.first_name && form.last_name && form.phone && form.email && form.city;
  const canAdvance2 = form.diploma && form.current_situation && (!isPhysio || form.adeli_rpps);
  const canSubmit = contractAccepted && signerName.trim() && hasSignature;

  return (
    <div data-testid="become-pro-page" style={{ minHeight: '100vh', background: C.bg, fontFamily: C.font, display: 'flex', flexDirection: 'column', alignItems: 'center' } as any}>

      {/* Header */}
      <div style={{ width: '100%', background: AC_GRADIENT, padding: '40px 20px 50px', textAlign: 'center' } as any}>
        <div data-testid="pro-logo" onClick={() => router.push('/' as any)} style={{ cursor: 'pointer', marginBottom: 16 } as any}>
          <i className={isPhysio ? 'ri-stethoscope-line' : 'ri-run-line'} style={{ fontSize: 40, color: '#FFF' }} />
        </div>
        <div style={{ fontSize: 26, fontWeight: 900, color: '#FFF', letterSpacing: -0.5, marginBottom: 8 }}>{TITLE}</div>
        <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', maxWidth: 500, margin: '0 auto', lineHeight: 1.6 }}>{SUBTITLE}</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 20, padding: '10px 16px', borderRadius: 999, background: 'rgba(255,255,255,0.15)', display: 'inline-flex' } as any}>
          <i className="ri-money-euro-circle-line" style={{ fontSize: 16, color: '#FFF' }} />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>Rémunération : 45 EUR HT / mois / beneficiaire</span>
        </div>
      </div>

      {/* Progress */}
      {step < 4 && (
        <div style={{ width: '100%', maxWidth: 560, padding: '20px 24px 0' } as any}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 6 } as any}>
            {STEPS.map((s, i) => (
              <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: step > i ? (AC) : C.border, transition: 'background 0.3s' } as any} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' } as any}>
            {STEPS.map((s, i) => (
              <span key={i} style={{ fontSize: 10, fontWeight: 600, color: step > i ? C.text : C.light }}>{s}</span>
            ))}
          </div>
        </div>
      )}

      {/* Form content */}
      <div style={{ width: '100%', maxWidth: 560, padding: '24px 24px 60px' } as any}>

        {/* Step 1: Informations personnelles */}
        {step === 1 && (
          <div data-testid="step-1-info">
            <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 4 }}>Informations personnelles</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 24, lineHeight: 1.5 }}>Ces informations seront utilisees pour créer votre profil professionnel.</div>

            <div style={{ display: 'flex', gap: 12, marginBottom: 16 } as any}>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Prenom<span style={req}>*</span></label>
                <input data-testid="input-first-name" value={form.first_name} onChange={e => upd('first_name', e.target.value)} placeholder="Jean" style={inp} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Nom<span style={req}>*</span></label>
                <input data-testid="input-last-name" value={form.last_name} onChange={e => upd('last_name', e.target.value)} placeholder="Dupont" style={inp} />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Telephone<span style={req}>*</span></label>
              <input data-testid="input-phone" value={form.phone} onChange={e => upd('phone', e.target.value)} placeholder="+33 6 12 34 56 78" style={inp} />
              <div style={{ fontSize: 10, color: C.light, marginTop: 4 }}>Ce numéro sera utilise pour activer votre espace sur l'application.</div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Email<span style={req}>*</span></label>
              <input data-testid="input-email" type="email" value={form.email} onChange={e => upd('email', e.target.value)} placeholder="jean.dupont@email.com" style={inp} />
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 } as any}>
              <div style={{ flex: 2 }}>
                <label style={lbl}>Ville<span style={req}>*</span></label>
                <input data-testid="input-city" value={form.city} onChange={e => upd('city', e.target.value)} placeholder="Paris" style={inp} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Code postal</label>
                <input data-testid="input-postal" value={form.postal_code} onChange={e => upd('postal_code', e.target.value)} placeholder="75001" style={inp} />
              </div>
            </div>

            <div data-testid="btn-next-1" onClick={canAdvance1 ? () => setStep(2) : undefined}
              style={{ padding: '16px', borderRadius: C.r, textAlign: 'center', cursor: canAdvance1 ? 'pointer' : 'default',
                background: canAdvance1 ? (AC) : C.border, color: canAdvance1 ? '#FFF' : C.light,
                fontSize: 15, fontWeight: 800, marginTop: 8, transition: 'all 0.2s',
              } as any}>
              Continuer
            </div>
          </div>
        )}

        {/* Step 2: Diplomes & Experience */}
        {step === 2 && (
          <div data-testid="step-2-qualifications">
            <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 4 }}>Diplomes & Experience</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 24, lineHeight: 1.5 }}>Vérifiez votre légitimité en tant que professionnel de santé.</div>

            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Diplome / Certification<span style={req}>*</span></label>
              <input data-testid="input-diploma" value={form.diploma} onChange={e => upd('diploma', e.target.value)}
                placeholder={isPhysio ? 'Diplome d\'Etat de Masseur-Kinesitherapeute' : 'BPJEPS / DEJEPS / Licence STAPS'}
                style={inp} />
            </div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 } as any}>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Annee d'obtention</label>
                <input data-testid="input-diploma-year" value={form.diploma_year} onChange={e => upd('diploma_year', e.target.value)} placeholder="2018" style={inp} />
              </div>
              <div style={{ flex: 2 }}>
                <label style={lbl}>Specialisation</label>
                <select data-testid="select-specialization" value={form.specialization} onChange={e => upd('specialization', e.target.value)} style={sel}>
                  <option value="">Choisir...</option>
                  {SPECS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            {isPhysio && (
              <div style={{ marginBottom: 16 }}>
                <label style={lbl}>Numéro ADELI / RPPS<span style={req}>*</span></label>
                <input data-testid="input-adeli" value={form.adeli_rpps} onChange={e => upd('adeli_rpps', e.target.value)} placeholder="10 75 XXXXX X" style={inp} />
                <div style={{ fontSize: 10, color: C.light, marginTop: 4 }}>Obligatoire pour les professionnels de santé réglementés.</div>
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>SIRET (optionnel)</label>
              <input data-testid="input-siret" value={form.siret} onChange={e => upd('siret', e.target.value)} placeholder="123 456 789 00012" style={inp} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Situation actuelle<span style={req}>*</span></label>
              <select data-testid="select-situation" value={form.current_situation} onChange={e => upd('current_situation', e.target.value)} style={sel}>
                <option value="">Choisir...</option>
                {SITUATIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Nombre de clients actuels</label>
              <input data-testid="input-clients" type="number" value={form.current_clients || ''} onChange={e => upd('current_clients', parseInt(e.target.value) || 0)} placeholder="0" style={inp} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Motivation (optionnel)</label>
              <textarea data-testid="input-motivation" value={form.motivation} onChange={e => upd('motivation', e.target.value)}
                placeholder="Pourquoi souhaitez-vous rejoindre le reseau Chutex ?"
                style={{ ...inp, minHeight: 80, resize: 'vertical' } as any} />
            </div>

            <div style={{ display: 'flex', gap: 12 } as any}>
              <div onClick={() => setStep(1)} style={{ flex: 1, padding: '16px', borderRadius: C.r, textAlign: 'center', cursor: 'pointer', border: `1.5px solid ${C.border}`, color: C.text, fontSize: 15, fontWeight: 700 } as any}>Retour</div>
              <div data-testid="btn-next-2" onClick={canAdvance2 ? () => { setStep(3); fetchContract(); } : undefined}
                style={{ flex: 2, padding: '16px', borderRadius: C.r, textAlign: 'center', cursor: canAdvance2 ? 'pointer' : 'default',
                  background: canAdvance2 ? (AC) : C.border, color: canAdvance2 ? '#FFF' : C.light,
                  fontSize: 15, fontWeight: 800, transition: 'all 0.2s',
                } as any}>
                Continuer
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Contrat & Signature */}
        {step === 3 && (
          <div data-testid="step-3-contract">
            <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 4 }}>Contrat de partenariat</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 24, lineHeight: 1.5 }}>Lisez attentivement le contrat et signez electroniquement pour valider votre candidature.</div>

            {/* Contract text */}
            <div style={{ background: C.card, borderRadius: C.r, padding: '20px', marginBottom: 20, maxHeight: 300, overflowY: 'auto', border: `1px solid ${C.border}` } as any}>
              <pre style={{ whiteSpace: 'pre-wrap', fontSize: 12, color: C.text, lineHeight: 1.7, fontFamily: C.font, margin: 0 } as any}>
                {contractText || 'Chargement du contrat...'}
              </pre>
            </div>

            {/* Key terms highlight */}
            <div style={{ background: `${AC}08`, borderRadius: C.r, padding: '16px', marginBottom: 20, border: `1px solid ${AC}20` } as any}>
              <div style={{ fontSize: 13, fontWeight: 700, color: AC, marginBottom: 8 }}>Points cles du contrat</div>
              <div style={{ fontSize: 12, color: C.text, lineHeight: 1.6 }}>
                - Rémunération : <strong>45 EUR HT / mois / bénéficiaire actif</strong><br />
                - Paiement mensuel par virement bancaire<br />
                - Engagement a suivre les beneficiaires via la plateforme<br />
                - Delai de reponse : 24h ouvrables maximum<br />
                - Resiliation avec preavis de 30 jours
              </div>
            </div>

            {/* Signature area */}
            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Nom complet du signataire<span style={req}>*</span></label>
              <input data-testid="input-signer" value={signerName} onChange={e => setSignerName(e.target.value)} placeholder={`${form.first_name} ${form.last_name}`} style={inp} />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={lbl}>Signature electronique<span style={req}>*</span></label>
              <div style={{ border: `2px solid ${hasSignature ? (AC) : C.border}`, borderRadius: C.r, overflow: 'hidden', position: 'relative', background: '#FAFAFA', transition: 'border-color 0.2s' } as any}>
                <canvas ref={canvasRef} width={500} height={150}
                  onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                  style={{ width: '100%', height: 150, cursor: 'crosshair', display: 'block' } as any} />
                {!hasSignature && (
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: 13, color: C.light, pointerEvents: 'none' } as any}>
                    Signez ici avec la souris
                  </div>
                )}
              </div>
              {hasSignature && (
                <div data-testid="clear-signature" onClick={clearSignature} style={{ fontSize: 11, color: AC, cursor: 'pointer', marginTop: 6, fontWeight: 600 } as any}>
                  Effacer la signature
                </div>
              )}
            </div>

            {/* Checkbox accept */}
            <div onClick={() => setContractAccepted(!contractAccepted)}
              style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer', padding: '14px 16px', borderRadius: C.r, background: contractAccepted ? `${AC}06` : C.card, border: `1.5px solid ${contractAccepted ? (AC) : C.border}`, marginBottom: 20, transition: 'all 0.2s' } as any}>
              <div data-testid="checkbox-accept" style={{ width: 22, height: 22, borderRadius: 6, flexShrink: 0, marginTop: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: contractAccepted ? (AC) : '#FFF', border: `2px solid ${contractAccepted ? (AC) : C.border}`, transition: 'all 0.2s',
              } as any}>
                {contractAccepted && <i className="ri-check-line" style={{ fontSize: 14, color: '#FFF' }} />}
              </div>
              <div style={{ fontSize: 13, color: C.text, lineHeight: 1.5 }}>
                J'ai lu et j'accepte les termes du contrat de partenariat Chutex.
                Je certifie etre titulaire des diplomes mentionnes et exercer de maniere legitime.
              </div>
            </div>

            {error && <div data-testid="error-msg" style={{ padding: '12px 16px', borderRadius: 12, background: '#FEE2E2', color: '#DC2626', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>{error}</div>}

            <div style={{ display: 'flex', gap: 12 } as any}>
              <div onClick={() => setStep(2)} style={{ flex: 1, padding: '16px', borderRadius: C.r, textAlign: 'center', cursor: 'pointer', border: `1.5px solid ${C.border}`, color: C.text, fontSize: 15, fontWeight: 700 } as any}>Retour</div>
              <div data-testid="btn-submit" onClick={canSubmit && !saving ? submitApplication : undefined}
                style={{ flex: 2, padding: '16px', borderRadius: C.r, textAlign: 'center', cursor: canSubmit && !saving ? 'pointer' : 'default',
                  background: canSubmit ? (AC) : C.border, color: canSubmit ? '#FFF' : C.light,
                  fontSize: 15, fontWeight: 800, opacity: saving ? 0.6 : 1, transition: 'all 0.2s',
                } as any}>
                {saving ? 'Envoi en cours...' : 'Signer et envoyer'}
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Success */}
        {step === 4 && (
          <div data-testid="step-4-success" style={{ textAlign: 'center', padding: '40px 0' } as any}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: `${AC}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' } as any}>
              <i className="ri-check-double-line" style={{ fontSize: 36, color: AC }} />
            </div>
            <div style={{ fontSize: 22, fontWeight: 900, color: C.text, marginBottom: 12 }}>Candidature validee !</div>
            <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.7, maxWidth: 420, margin: '0 auto 24px' }}>
              {success || `Votre candidature a été validee. Un SMS et un email de confirmation vous ont ete envoyes.`}
            </div>

            <div style={{ background: C.card, borderRadius: C.r, padding: '20px', marginBottom: 24, textAlign: 'left' } as any}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 12 }}>Prochaines etapes :</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 } as any}>
                {[
                  { icon: 'ri-smartphone-line', text: `Telechargez l'application Chutex Care` },
                  { icon: 'ri-shield-user-line', text: `Inscrivez-vous en tant que "Gardien" avec le numéro ${form.phone}` },
                  { icon: 'ri-magic-line', text: `Votre espace ${isPhysio ? 'kinesitherapeute' : 'coach sportif'} sera automatiquement active` },
                ].map((s, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 } as any}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: `${AC}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                      <i className={s.icon} style={{ fontSize: 16, color: AC }} />
                    </div>
                    <span style={{ fontSize: 13, color: C.text }}>{s.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div data-testid="btn-go-app" onClick={() => router.push('/login' as any)}
              style={{ padding: '16px 32px', borderRadius: C.r, background: AC, color: '#FFF', fontSize: 15, fontWeight: 800, cursor: 'pointer', display: 'inline-block' } as any}>
              Aller sur l'application
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
