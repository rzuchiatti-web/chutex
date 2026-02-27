import React, { useState, useEffect } from 'react';
import { Platform, View, Text } from 'react-native';

const API = process.env.EXPO_PUBLIC_BACKEND_URL || '';
let STRIPE_PK = '';
const IMG_BRACELET = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/2fto1qw7_bracelet_sante_connecte_elio_chutex_care_teleassistance_telealarme%281%29.svg';
const IMG_GILET = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/ljh1zzu3_Gilet_Elder_airbag_Chutex.svg';

type Plan = { id: string; name: string; description: string; price: number; price_after_credit: number; includes: string[] };
type Guardian = { first_name: string; last_name: string; phone: string; email: string; address: string; city: string; postal_code: string; within_30min: boolean; has_keys: boolean; relationship: string; is_admin_ref: boolean };

const EMPTY_G: Guardian = { first_name: '', last_name: '', phone: '', email: '', address: '', city: '', postal_code: '', within_30min: false, has_keys: false, relationship: '', is_admin_ref: false };
const RELS = ['Fils/Fille', 'Conjoint(e)', 'Petit-fils/Petite-fille', 'Frere/Soeur', 'Neveu/Niece', 'Ami(e)', 'Voisin(e)', 'Aide a domicile', 'Autre'];
const ANIMALS = ['Chien', 'Chat', 'Oiseau', 'Autre'];
const HOUSING_TYPES = ['Appartement', 'Maison', 'Residence senior'];

/* ─── Theme ─── */
const V = '#7C3AED';
const C = { bg: '#FFFFFF', card: '#F4F4F5', border: '#E4E4E7', accent: V, green: '#059669', text: '#18181B', muted: '#71717A', light: '#A1A1AA', white: '#FFF', pill: 999, r: 16, font: "'Inter', system-ui, sans-serif" };
const inp: any = { width: '100%', padding: '13px 16px', borderRadius: 12, background: '#FFF', border: `1.5px solid ${C.border}`, color: C.text, fontSize: 15, fontFamily: C.font, boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.2s' };
const lbl: any = { fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 5, display: 'block', letterSpacing: 0.8, textTransform: 'uppercase' };
const req: any = { color: V, marginLeft: 2 };
const row: any = { display: 'flex', gap: 12 };
const sel: any = { ...inp, appearance: 'none', WebkitAppearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%2371717A' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' };

const CONTRACT_TEXT = `CONTRAT DE TELEASSISTANCE CHUTEX CARE

Article 1 - Objet
Le present contrat a pour objet la mise a disposition d'un service de teleassistance 24h/24, 7j/7, comprenant la fourniture d'equipements connectes (bracelet Elio et/ou gilet Elder) et l'acces a la plateforme de surveillance Chutex Care.

Article 2 - Duree
Le contrat est conclu pour une duree indeterminee. Il peut etre resilie a tout moment par l'une ou l'autre des parties moyennant un preavis de 30 jours.

Article 3 - Equipements fournis
Les equipements restent la propriete de Chutex Innovation et doivent etre restitues en cas de resiliation. Le beneficiaire s'engage a en prendre soin et a signaler tout dysfonctionnement.

Article 4 - Service de teleassistance
Le service comprend : la reception des alertes 24h/24, le contact telephonique avec le beneficiaire, l'alerte des personnes designees, le declenchement des secours si necessaire.

Article 5 - Tarification
Le prix mensuel est fixe selon la formule choisie. Le prelevement est effectue mensuellement par carte bancaire ou prelevement SEPA. Le service ouvre droit a un credit d'impot de 50% au titre des services a la personne.

Article 6 - Protection des donnees
Les donnees personnelles collectees sont traitees conformement au RGPD. Le beneficiaire dispose d'un droit d'acces, de rectification et de suppression de ses donnees.

Article 7 - Responsabilite
Chutex Innovation met en oeuvre tous les moyens necessaires pour assurer la continuite du service. La responsabilite de Chutex Innovation ne saurait etre engagee en cas de force majeure.`;

export default function SubscriptionPage() {
  const [step, setStep] = useState(1);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState('');
  const [subType, setSubType] = useState('');
  const [ben, setBen] = useState({ gender: 'F', first_name: '', last_name: '', phone: '', date_of_birth: '', address: '', city: '', postal_code: '' });
  const [housing, setHousing] = useState({ type: '', floor: '', door: '', access_code: '', key_safe: false, key_safe_sell: false, animal: '', animal_type: '' });
  const [guardians, setGuardians] = useState<Guardian[]>([{ ...EMPTY_G }]);
  const [consent, setConsent] = useState(false);
  const [delivery, setDelivery] = useState({ type: 'beneficiary', guardian_index: 0 });
  const [billing, setBilling] = useState({ person: 'guardian', guardian_index: 0 });
  const [signerName, setSignerName] = useState('');
  const [contractRead, setContractRead] = useState(false);
  const [contractId, setContractId] = useState('');
  const [contractNumber, setContractNumber] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [stripeReady, setStripeReady] = useState(false);
  const [paymentDone, setPaymentDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${API}/api/plans`).then(r => r.json()).then(setPlans).catch(() => {});
    fetch(`${API}/api/stripe/config`).then(r => r.json()).then(d => { STRIPE_PK = d.publishable_key; }).catch(() => {});
    // Load Stripe.js
    if (typeof window !== 'undefined' && !(window as any).Stripe) {
      const s = document.createElement('script');
      s.src = 'https://js.stripe.com/v3/';
      s.onload = () => setStripeReady(true);
      document.head.appendChild(s);
    } else if (typeof window !== 'undefined') {
      setStripeReady(true);
    }
  }, []);

  // Force white background over global dark CSS (web only)
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const style = document.createElement('style');
    style.id = 'sub-override';
    style.textContent = `
      html, body, #root { background: #FFFFFF !important; }
      #root > div, #root > div > div, #root > div > div > div { background: transparent !important; }
      [role="tablist"] { display: none !important; }
      .chx-bg-dark::before, .chx-bg-light::before { display: none !important; }
      #sub-root { position: fixed !important; inset: 0 !important; z-index: 99999 !important; background: #FFFFFF !important; overflow-y: auto !important; }
    `;
    document.head.appendChild(style);
    return () => { style.remove(); };
  }, []);

  const pollPay = async (cid: string, a = 0) => { if (a >= 10) return; try { const r = await fetch(`${API}/api/contract/confirm/${cid}`); const d = await r.json(); if (d.status === 'active') { setPaymentDone(true); setStep(8); return; } setTimeout(() => pollPay(cid, a + 1), 2000); } catch {} };
  const plan = plans.find(p => p.id === selectedPlan);
  const deliveryDate = (() => { const d = new Date(); d.setDate(d.getDate() + 5); while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1); return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }); })();

  // Step 7a: Create contract + mount Stripe Elements
  const handleCreateContract = async () => {
    setLoading(true); setError('');
    try {
      await fetch(`${API}/api/contract/sign/__pending__`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ signer_name: signerName }) }).catch(() => {});
      const res = await fetch(`${API}/api/contract/create`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan: selectedPlan, subscriber_type: subType, beneficiary: ben, housing, guardians, delivery, billing }) });
      if (!res.ok) throw new Error((await res.json()).detail || 'Erreur');
      const c = await res.json();
      setContractId(c.id); setContractNumber(c.contract_number); setClientSecret(c.client_secret);
      // Sign contract
      await fetch(`${API}/api/contract/sign/${c.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ signer_name: signerName }) });
      // Mount Stripe Elements after a tick
      setTimeout(() => mountStripeElements(c.client_secret), 300);
    } catch (e: any) { setError(e.message); }
    setLoading(false);
  };

  const mountStripeElements = (secret: string) => {
    const container = document.getElementById('stripe-payment-element');
    if (!container || !(window as any).Stripe) return;
    container.innerHTML = '';
    const pk = STRIPE_PK;
    const stripeObj = (window as any).Stripe(pk);
    (window as any)._stripe = stripeObj;
    const elements = stripeObj.elements({ clientSecret: secret, appearance: { theme: 'flat', variables: { fontFamily: "'Inter', system-ui", colorPrimary: '#7C3AED', borderRadius: '12px' } } });
    const payEl = elements.create('payment', { layout: 'tabs' });
    payEl.mount('#stripe-payment-element');
    (window as any)._stripeElements = elements;
  };

  const handleConfirmPayment = async () => {
    setLoading(true); setError('');
    const stripeObj = (window as any)._stripe;
    const elements = (window as any)._stripeElements;
    if (!stripeObj || !elements) { setError('Stripe non charge'); setLoading(false); return; }
    const { error: stripeError } = await stripeObj.confirmPayment({ elements, confirmParams: { return_url: `${window.location.origin}/subscription?step=confirmation&contract_id=${contractId}` }, redirect: 'if_required' });
    if (stripeError) { setError(stripeError.message); setLoading(false); return; }
    // Payment succeeded inline
    pollPay(contractId);
    setLoading(false);
  };

  if (Platform.OS !== 'web') return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' }}><Text style={{ color: '#000', fontSize: 16 }}>Ouvrez dans un navigateur.</Text></View>;

  const STEPS = ['Formule', 'Decouvrir', 'Beneficiaire', 'Logement', 'Gardiens', 'Livraison', 'Contrat & Paiement', 'Confirmation'];
  const canNext = () => { if (step === 1) return !!selectedPlan; if (step === 3) return !!(ben.first_name && ben.last_name && ben.phone && subType); if (step === 4) return !!housing.type; if (step === 5) return guardians.length > 0 && !!(guardians[0].first_name && guardians[0].phone) && consent; return true; };

  const Chip = ({ on, children, onClick }: any) => <div onClick={onClick} style={{ padding: '8px 16px', borderRadius: C.pill, background: on ? `${V}12` : '#FFF', border: `1.5px solid ${on ? V : C.border}`, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: on ? V : C.muted, transition: 'all 0.15s' }}>{children}</div>;
  const Check = ({ on, onClick, label }: any) => <div onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 0' }}><div style={{ width: 20, height: 20, borderRadius: 5, border: `2px solid ${on ? V : C.border}`, background: on ? V : '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s', flexShrink: 0 }}>{on && <span style={{ color: '#FFF', fontSize: 11, fontWeight: 700 }}>✓</span>}</div><span style={{ fontSize: 13, color: C.text }}>{label}</span></div>;

  const renderStep = () => {
    switch (step) {
      case 1: return (<div><div style={{ textAlign: 'center', marginBottom: 36 }}><div style={{ fontSize: 12, fontWeight: 700, color: V, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Teleassistance Chutex Care</div><div style={{ fontSize: 26, fontWeight: 900, color: C.text, marginBottom: 6 }}>Choisissez votre formule</div><div style={{ fontSize: 14, color: C.muted }}>Protection et tranquillite pour vos proches, 24h/24.</div></div>
        {plans.map(p => { const img = p.id === 'bracelet' ? IMG_BRACELET : IMG_GILET; const on = selectedPlan === p.id; return (
          <div key={p.id} data-testid={`plan-${p.id}`} onClick={() => { setSelectedPlan(p.id); setStep(2); }} style={{ padding: 0, borderRadius: C.r, background: '#FFF', border: `2px solid ${on ? V : C.border}`, cursor: 'pointer', marginBottom: 16, overflow: 'hidden', transition: 'all 0.2s', boxShadow: on ? `0 0 0 3px ${V}20` : '0 2px 8px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px' }}>
              <div style={{ width: 90, height: 90, borderRadius: 14, background: C.card, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}><img src={img} alt={p.name} style={{ width: '80%', height: '80%', objectFit: 'contain' } as any} /></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: C.text, marginBottom: 4 }}>{p.name}</div>
                <div style={{ fontSize: 13, color: C.muted, marginBottom: 8, lineHeight: 1.4 }}>{p.description}</div>
                <div style={{ fontSize: 22, fontWeight: 900, color: V }}>{p.price.toFixed(2).replace('.', ',')} <span style={{ fontSize: 12, fontWeight: 500, color: C.muted }}>EUR/mois</span></div>
                <div style={{ fontSize: 12, color: C.green, fontWeight: 600 }}>soit {p.price_after_credit.toFixed(2).replace('.', ',')} EUR apres credit d'impot*</div>
              </div>
            </div>
          </div>); })}
        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: C.light }}>*Credit d'impot de 50% (art. 199 sexdecies du CGI)</div></div>);

      case 2: return plan ? (<div>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ width: 120, height: 120, borderRadius: 24, background: C.card, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}><img src={selectedPlan === 'bracelet' ? IMG_BRACELET : IMG_GILET} alt="" style={{ width: '75%', height: '75%', objectFit: 'contain' } as any} /></div>
          <div style={{ fontSize: 22, fontWeight: 900, color: C.text, marginBottom: 4 }}>{plan.name}</div>
          <div style={{ fontSize: 32, fontWeight: 900, color: V }}>{plan.price.toFixed(2).replace('.', ',')} <span style={{ fontSize: 14, color: C.muted }}>EUR/mois</span></div>
          <div style={{ fontSize: 13, color: C.green, fontWeight: 600 }}>soit {plan.price_after_credit.toFixed(2).replace('.', ',')} EUR/mois apres credit d'impot 50%</div>
        </div>
        <div style={{ background: C.card, borderRadius: C.r, padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 14 }}>Votre protection au quotidien</div>
          {[
            { icon: '🔔', title: 'Teleassistance 24h/24, 7j/7', desc: 'Une equipe de professionnels a votre ecoute jour et nuit, prete a intervenir en cas de besoin.' },
            { icon: '📲', title: 'Detection de chute automatique', desc: 'Le bracelet detecte les chutes et envoie une alerte meme si vous ne pouvez pas appuyer sur le bouton.' },
            { icon: '❤️', title: 'Suivi cardiaque en continu', desc: 'Frequence cardiaque, SpO2, tension — toutes vos constantes suivies et partagees avec vos proches.' },
            { icon: '🆘', title: 'Bouton SOS', desc: 'Un simple appui pour alerter instantanement la plateforme et vos gardiens.' },
            { icon: '📱', title: 'Application mobile Chutex', desc: 'Vos proches suivent votre sante en temps reel, recoivent les alertes et communiquent avec vous.' },
            { icon: '🤖', title: 'Assistant IA Nora', desc: 'Une intelligence artificielle qui analyse vos donnees et vous accompagne dans votre parcours sante.' },
          ].concat(selectedPlan === 'bracelet_gilet' ? [
            { icon: '🦺', title: 'Gilet airbag Elder', desc: 'Protection airbag qui se deploie en 80ms lors d\'une chute. Reduit l\'impact de 90% sur les hanches et le dos.' },
          ] : []).map((f, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>{f.icon}</div>
              <div><div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{f.title}</div><div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>{f.desc}</div></div>
            </div>
          ))}
        </div>
        <div style={{ background: `${V}08`, border: `1px solid ${V}20`, borderRadius: C.r, padding: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: V, marginBottom: 6 }}>Sans engagement</div>
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>Resiliable a tout moment. Livraison gratuite sous 3 jours ouvrables. Installation et mise en service incluses.</div>
        </div></div>) : null;

      case 3: return (<div>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 4 }}>Beneficiaire</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Pour qui souscrivez-vous ?</div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
          {[{v:'self',l:'Pour moi-meme'},{v:'relative',l:'Pour un proche'}].map(o => (
            <div key={o.v} data-testid={`sub-type-${o.v}`} onClick={() => setSubType(o.v)} style={{ flex: 1, padding: 14, borderRadius: C.r, background: subType === o.v ? `${V}08` : '#FFF', border: `2px solid ${subType === o.v ? V : C.border}`, cursor: 'pointer', textAlign: 'center', fontSize: 14, fontWeight: 700, color: subType === o.v ? V : C.muted }}>{o.l}</div>
          ))}
        </div>
        {subType && (<div style={{ background: C.card, borderRadius: C.r, padding: 20 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 16 }}>{subType === 'self' ? 'Vos informations' : 'Informations du beneficiaire'}</div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>{[{v:'F',l:'Madame'},{v:'M',l:'Monsieur'}].map(g => <Chip key={g.v} on={ben.gender===g.v} onClick={() => setBen({...ben, gender:g.v})}>{g.l}</Chip>)}</div>
          <div style={row}><div style={{flex:1}}><label style={lbl}>Prenom<span style={req}>*</span></label><input data-testid="ben-first-name" value={ben.first_name} onChange={e => setBen({...ben, first_name: e.target.value})} style={inp} placeholder="Prenom" /></div><div style={{flex:1}}><label style={lbl}>Nom<span style={req}>*</span></label><input data-testid="ben-last-name" value={ben.last_name} onChange={e => setBen({...ben, last_name: e.target.value})} style={inp} placeholder="Nom" /></div></div>
          <div style={{height:12}} />
          <div style={row}><div style={{flex:1}}><label style={lbl}>Telephone<span style={req}>*</span></label><input data-testid="ben-phone" value={ben.phone} onChange={e => setBen({...ben, phone: e.target.value})} style={inp} placeholder="06 12 34 56 78" type="tel" /></div><div style={{flex:1}}><label style={lbl}>Date de naissance</label><input value={ben.date_of_birth} onChange={e => setBen({...ben, date_of_birth: e.target.value})} style={inp} type="date" /></div></div>
          <div style={{height:12}} />
          <label style={lbl}>Adresse<span style={req}>*</span></label><input value={ben.address} onChange={e => setBen({...ben, address: e.target.value})} style={inp} placeholder="12 rue de la Paix" />
          <div style={{height:12}} />
          <div style={row}><div style={{flex:2}}><label style={lbl}>Ville<span style={req}>*</span></label><input value={ben.city} onChange={e => setBen({...ben, city: e.target.value})} style={inp} placeholder="Paris" /></div><div style={{flex:1}}><label style={lbl}>Code postal<span style={req}>*</span></label><input value={ben.postal_code} onChange={e => setBen({...ben, postal_code: e.target.value})} style={inp} placeholder="75001" /></div></div>
        </div>)}
      </div>);

      case 4: return (<div>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 4 }}>Acces au logement</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Ces informations permettent une intervention rapide des secours.</div>
        <label style={lbl}>Type de logement<span style={req}>*</span></label>
        <div style={{ display: 'flex', gap: 10, marginBottom: 20 }}>{HOUSING_TYPES.map(t => <Chip key={t} on={housing.type===t} onClick={() => setHousing({...housing, type: t})}>{t}</Chip>)}</div>
        {housing.type && (<div style={{ background: C.card, borderRadius: C.r, padding: 20 }}>
          {housing.type === 'Appartement' && (<><div style={row}><div style={{flex:1}}><label style={lbl}>Etage</label><input value={housing.floor} onChange={e => setHousing({...housing, floor: e.target.value})} style={inp} placeholder="RDC, 1er, 2e..." /></div><div style={{flex:1}}><label style={lbl}>Porte / Batiment</label><input value={housing.door} onChange={e => setHousing({...housing, door: e.target.value})} style={inp} placeholder="Porte droite, Bat. B" /></div></div><div style={{height:12}} /><label style={lbl}>Code d'acces immeuble</label><input value={housing.access_code} onChange={e => setHousing({...housing, access_code: e.target.value})} style={inp} placeholder="1234A ou digicode" /><div style={{height:16}} /></>)}
          {housing.type === 'Residence senior' && (<><label style={lbl}>Numero de chambre / logement</label><input value={housing.door} onChange={e => setHousing({...housing, door: e.target.value})} style={inp} placeholder="Chambre 12, Logement B3..." /><div style={{height:12}} /><label style={lbl}>Code d'acces residence</label><input value={housing.access_code} onChange={e => setHousing({...housing, access_code: e.target.value})} style={inp} placeholder="Code ou badge" /><div style={{height:16}} /></>)}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderTop: `1px solid ${C.border}` }}>
            <div><div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Coffre a cles</div><div style={{ fontSize: 12, color: C.muted }}>Facilite l'acces des secours</div></div>
            <div style={{ display: 'flex', gap: 8 }}>{[{v:true,l:'Oui'},{v:false,l:'Non'}].map(o => <Chip key={String(o.v)} on={housing.key_safe===o.v} onClick={() => setHousing({...housing, key_safe: o.v, key_safe_sell:false})}>{o.l}</Chip>)}</div>
          </div>
          {!housing.key_safe && <Check on={housing.key_safe_sell} onClick={() => setHousing({...housing, key_safe_sell: !housing.key_safe_sell})} label="Commander un coffre a cles securise (29,90 EUR)" />}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderTop: `1px solid ${C.border}` }}>
            <div><div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Animal de compagnie</div></div>
            <select value={housing.animal} onChange={e => setHousing({...housing, animal: e.target.value})} style={{...sel, width: 140}}>
              <option value="">Aucun</option>{ANIMALS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>)}
      </div>);

      case 5: return (<div>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 4 }}>Personnes a prevenir</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>En cas d'alerte, ces personnes seront contactees. Un SMS leur sera envoye pour telecharger l'app Chutex.</div>
        {guardians.map((g, i) => (
          <div key={i} style={{ background: C.card, borderRadius: C.r, padding: 20, marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>Gardien {i+1} {g.is_admin_ref && <span style={{ fontSize: 11, color: V, fontWeight: 600 }}> — Referent administratif</span>}</div>
              {guardians.length > 1 && <div onClick={() => setGuardians(guardians.filter((_,j)=>j!==i))} style={{ fontSize: 12, color: '#EF4444', cursor: 'pointer' }}>Supprimer</div>}
            </div>
            <div style={row}><div style={{flex:1}}><label style={lbl}>Prenom<span style={req}>*</span></label><input value={g.first_name} onChange={e=>{const u=[...guardians];u[i]={...u[i],first_name:e.target.value};setGuardians(u)}} style={inp} placeholder="Prenom" /></div><div style={{flex:1}}><label style={lbl}>Nom<span style={req}>*</span></label><input value={g.last_name} onChange={e=>{const u=[...guardians];u[i]={...u[i],last_name:e.target.value};setGuardians(u)}} style={inp} placeholder="Nom" /></div></div>
            <div style={{height:10}} />
            <div style={row}><div style={{flex:1}}><label style={lbl}>Telephone<span style={req}>*</span></label><input value={g.phone} onChange={e=>{const u=[...guardians];u[i]={...u[i],phone:e.target.value};setGuardians(u)}} style={inp} placeholder="06 ..." type="tel" /></div><div style={{flex:1}}><label style={lbl}>Email</label><input value={g.email} onChange={e=>{const u=[...guardians];u[i]={...u[i],email:e.target.value};setGuardians(u)}} style={inp} placeholder="email@..." /></div></div>
            <div style={{height:10}} />
            <label style={lbl}>Adresse</label><input value={g.address} onChange={e=>{const u=[...guardians];u[i]={...u[i],address:e.target.value};setGuardians(u)}} style={inp} placeholder="Adresse" />
            <div style={{height:10}} />
            <div style={row}><div style={{flex:2}}><label style={lbl}>Ville</label><input value={g.city} onChange={e=>{const u=[...guardians];u[i]={...u[i],city:e.target.value};setGuardians(u)}} style={inp} placeholder="Ville" /></div><div style={{flex:1}}><label style={lbl}>Code postal</label><input value={g.postal_code} onChange={e=>{const u=[...guardians];u[i]={...u[i],postal_code:e.target.value};setGuardians(u)}} style={inp} placeholder="75001" /></div></div>
            <div style={{height:10}} />
            <label style={lbl}>Lien avec le beneficiaire<span style={req}>*</span></label>
            <select value={g.relationship} onChange={e=>{const u=[...guardians];u[i]={...u[i],relationship:e.target.value};setGuardians(u)}} style={sel}><option value="">Choisir...</option>{RELS.map(r => <option key={r} value={r}>{r}</option>)}</select>
            <div style={{height:10}} />
            <div style={{ display: 'flex', gap: 12 }}>
              <Check on={g.within_30min} onClick={()=>{const u=[...guardians];u[i]={...u[i],within_30min:!u[i].within_30min};setGuardians(u)}} label="Habite a - de 30 min" />
              <Check on={g.has_keys} onClick={()=>{const u=[...guardians];u[i]={...u[i],has_keys:!u[i].has_keys};setGuardians(u)}} label="Possede les cles" />
            </div>
            <Check on={g.is_admin_ref} onClick={()=>{const u=guardians.map((gg,j)=>({...gg, is_admin_ref: j===i ? !gg.is_admin_ref : false}));setGuardians(u)}} label="Designez comme referent administratif" />
            {g.is_admin_ref && <div style={{ fontSize: 11, color: C.muted, marginTop: -4, marginLeft: 30, lineHeight: 1.5 }}>Le referent administratif est l'interlocuteur principal pour la gestion du contrat, la facturation et les demarches administratives.</div>}
          </div>
        ))}
        <div data-testid="add-guardian-btn" onClick={() => setGuardians([...guardians, {...EMPTY_G}])} style={{ padding: 14, borderRadius: C.r, border: `2px dashed ${C.border}`, cursor: 'pointer', textAlign: 'center', fontSize: 14, fontWeight: 700, color: V, marginBottom: 16 }}>+ Ajouter un gardien</div>
        <Check on={consent} onClick={() => setConsent(!consent)} label="L'abonne certifie sur l'honneur avoir recu le consentement des personnes designees a contacter." />
      </div>);

      case 6: return (<div>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 4 }}>Livraison</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Ou livrer {selectedPlan === 'bracelet_gilet' ? 'le bracelet et le gilet' : 'le bracelet'} ?</div>
        <div style={{ padding: 14, borderRadius: C.r, background: `${C.green}08`, border: `1px solid ${C.green}30`, marginBottom: 20, textAlign: 'center' }}><span style={{ fontSize: 13, color: C.green, fontWeight: 700 }}>Livraison gratuite — Estimation : {deliveryDate}</span></div>
        {[{type:'beneficiary', label:`Chez ${ben.first_name||'le beneficiaire'}`, sub:`${ben.address||''} ${ben.city||''}`.trim(), index:0}, ...guardians.map((g,i)=>({type:'guardian',index:i,label:`Chez ${g.first_name||`Gardien ${i+1}`}`,sub:`${g.address||''} ${g.city||''}`.trim()}))].map((o:any)=>(
          <div key={`${o.type}-${o.index}`} onClick={()=>setDelivery({type:o.type,guardian_index:o.index})} style={{ padding: 16, borderRadius: C.r, background: delivery.type===o.type&&delivery.guardian_index===o.index ? `${V}08` : '#FFF', border: `2px solid ${delivery.type===o.type&&delivery.guardian_index===o.index ? V : C.border}`, cursor: 'pointer', marginBottom: 10 }}><div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{o.label}</div>{o.sub && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{o.sub}</div>}</div>
        ))}
      </div>);

      case 7: return (<div>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 4 }}>Contrat & Paiement</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 20 }}>Lisez le contrat, signez et payez directement.</div>
        <div style={{ background: C.card, borderRadius: C.r, padding: 16, marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 8 }}>Contrat de teleassistance</div>
          <div style={{ height: 180, overflowY: 'auto', padding: 14, background: '#FFF', borderRadius: 10, border: `1px solid ${C.border}`, fontSize: 12, color: C.muted, lineHeight: 1.7, whiteSpace: 'pre-wrap' } as any} onScroll={(e: any) => { if (e.target.scrollTop + e.target.clientHeight >= e.target.scrollHeight - 20) setContractRead(true); }}>{CONTRACT_TEXT}</div>
          {!contractRead && <div style={{ fontSize: 11, color: V, marginTop: 6, textAlign: 'center' }}>Faites defiler pour lire l'integralite du contrat</div>}
        </div>
        <label style={lbl}>Signature electronique<span style={req}>*</span></label>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 8, lineHeight: 1.5 }}>En signant, vous acceptez les conditions du contrat ci-dessus.</div>
        <input data-testid="signer-name" value={signerName} onChange={e => setSignerName(e.target.value)} style={{...inp, borderColor: signerName ? V : C.border, fontStyle: signerName ? 'italic' : 'normal', fontSize: 18, fontWeight: 600}} placeholder="Tapez votre nom complet" />
        <div style={{height:16}} />
        <label style={lbl}>Personne a facturer</label>
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <Chip on={billing.person==='beneficiary'} onClick={()=>setBilling({...billing,person:'beneficiary',guardian_index:0})}>{ben.first_name||'Beneficiaire'}</Chip>
          {guardians.map((g,i)=><Chip key={i} on={billing.person==='guardian'&&billing.guardian_index===i} onClick={()=>setBilling({...billing,person:'guardian',guardian_index:i})}>{g.first_name||`Gardien ${i+1}`}</Chip>)}
        </div>
        <div style={{ background: C.card, borderRadius: C.r, padding: 16, marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}><span style={{ fontSize: 13, color: C.muted }}>{plan?.name} — mensuel</span><span style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{plan?.price.toFixed(2).replace('.',',')} EUR</span></div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: 12, color: C.green }}>Apres credit d'impot 50%</span><span style={{ fontSize: 14, fontWeight: 700, color: C.green }}>{plan?.price_after_credit.toFixed(2).replace('.',',')} EUR/mois</span></div>
        </div>
        {!clientSecret && !paymentDone && (<div data-testid="setup-payment-btn" onClick={() => { if (!contractRead) return setError('Veuillez lire le contrat en entier'); if (!signerName.trim()) return setError('Veuillez signer le contrat'); handleCreateContract(); }} style={{ padding: 16, borderRadius: C.pill, background: loading ? C.card : V, color: '#FFF', cursor: loading ? 'wait' : 'pointer', textAlign: 'center', fontSize: 15, fontWeight: 800, opacity: loading ? 0.6 : 1, boxShadow: loading ? 'none' : `0 4px 14px ${V}40`, marginBottom: 12 }}>{loading ? 'Preparation du paiement...' : 'Configurer le paiement'}</div>)}
        {clientSecret && !paymentDone && (<div style={{ background: '#FFF', borderRadius: C.r, border: `2px solid ${V}30`, padding: 20, marginBottom: 16 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}><svg width="16" height="16" fill="none" stroke={V} strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>Paiement securise</div>
          <div id="stripe-payment-element" style={{ minHeight: 100, marginBottom: 16 }}><div style={{ textAlign: 'center', padding: 20, color: C.muted, fontSize: 13 }}>Chargement du formulaire de paiement...</div></div>
          <div data-testid="confirm-pay-btn" onClick={handleConfirmPayment} style={{ padding: 16, borderRadius: C.pill, background: loading ? C.card : V, color: '#FFF', cursor: loading ? 'wait' : 'pointer', textAlign: 'center', fontSize: 15, fontWeight: 800, opacity: loading ? 0.6 : 1, boxShadow: loading ? 'none' : `0 4px 14px ${V}40` }}>{loading ? 'Traitement en cours...' : `Payer ${plan?.price.toFixed(2).replace('.',',')} EUR/mois`}</div>
          <div style={{ textAlign: 'center', marginTop: 8, fontSize: 11, color: C.light }}>Abonnement mensuel — CB ou prelevement SEPA</div>
        </div>)}
        {paymentDone && <div style={{ padding: 16, borderRadius: C.r, background: `${C.green}10`, border: `1px solid ${C.green}30`, textAlign: 'center', marginBottom: 16 }}><span style={{ fontSize: 14, fontWeight: 700, color: C.green }}>Paiement confirme !</span></div>}
        {error && <div style={{ padding: 12, borderRadius: 10, background: '#FEF2F2', border: '1px solid #FECACA', marginBottom: 14, fontSize: 13, color: '#DC2626', textAlign: 'center' }}>{error}</div>}
      </div>);

      case 8: return (<div style={{ textAlign: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: `${C.green}15`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}><span style={{ fontSize: 28, color: C.green }}>✓</span></div>
        <div style={{ fontSize: 24, fontWeight: 900, color: C.text, marginBottom: 6 }}>Souscription confirmee !</div>
        <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.6, marginBottom: 28 }}>Votre contrat est actif.{contractNumber && <> N° <strong style={{ color: C.text }}>{contractNumber}</strong></>}</div>
        <div style={{ background: C.card, borderRadius: C.r, padding: 20, textAlign: 'left' }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 14 }}>Prochaines etapes</div>
          {['SMS envoye au beneficiaire pour telecharger l\'app', 'Invitations envoyees aux gardiens', `Livraison prevue le ${deliveryDate}`, 'Un technicien vous contactera pour la mise en service'].map((s,i) => (
            <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 12 }}><div style={{ width: 24, height: 24, borderRadius: '50%', background: `${V}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 800, color: V }}>{i+1}</div><div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>{s}</div></div>
          ))}
        </div>
      </div>);
      default: return null;
    }
  };

  return (
    <div id="sub-root" style={{ minHeight: '100dvh', background: C.bg, fontFamily: C.font, color: C.text, display: 'flex', flexDirection: 'column' } as any}>
      <div style={{ padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.border}`, background: '#FFF' } as any}>
        <img src="https://customer-assets.emergentagent.com/job_2d68398c-4513-47de-99bf-424741ed2892/artifacts/94ajxqu1_Logo_chutex_Noir.png" alt="Chutex" style={{ height: 28 } as any} />
        <div style={{ fontSize: 11, color: C.light, display: 'flex', alignItems: 'center', gap: 4 }}>
          <svg width="12" height="12" fill="none" stroke={C.light} strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
          Souscription securisee
        </div>
      </div>
      {step < 8 && (<div style={{ padding: '12px 24px', background: '#FFF', borderBottom: `1px solid ${C.border}`, display: 'flex', gap: 3, alignItems: 'center' } as any}>{Array.from({length:7}).map((_,i)=>(<div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i+1<=step ? V : C.card, transition: 'background 0.3s' } as any} />))}<div style={{ fontSize: 11, color: C.light, marginLeft: 8, whiteSpace: 'nowrap' } as any}>{step}/7</div></div>)}
      <div style={{ flex: 1, overflowY: 'auto', padding: 24, maxWidth: 540, width: '100%', margin: '0 auto', boxSizing: 'border-box' } as any}>{renderStep()}</div>
      {step > 1 && step < 8 && (<div style={{ padding: '14px 24px', borderTop: `1px solid ${C.border}`, background: '#FFF', display: 'flex', gap: 12, maxWidth: 540, width: '100%', margin: '0 auto', boxSizing: 'border-box' } as any}>
        <div data-testid="back-btn" onClick={() => setStep(step-1)} style={{ padding: '13px 24px', borderRadius: C.pill, background: '#FFF', border: `1.5px solid ${C.border}`, cursor: 'pointer', fontSize: 14, fontWeight: 600, color: C.muted }}>Retour</div>
        {step < 7 && <div data-testid="next-btn" onClick={() => canNext() && setStep(step+1)} style={{ flex: 1, padding: 13, borderRadius: C.pill, background: canNext() ? V : C.card, color: canNext() ? '#FFF' : C.light, cursor: canNext() ? 'pointer' : 'not-allowed', textAlign: 'center', fontSize: 14, fontWeight: 700, boxShadow: canNext() ? `0 4px 14px ${V}30` : 'none' }}>Continuer</div>}
      </div>)}
    </div>
  );
}
