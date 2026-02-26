import React from 'react';
import { GI, INPUT_STYLE, PREFIXES, RegisterForm, UpdateFn, AcceptTerms } from './RegisterUI';

export default function SAADStep({ form, u }: { form: RegisterForm; u: UpdateFn }) {
  return (
    <>
      <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', marginBottom: 6 }}>Inscription SAAD</div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>Informations de votre structure</div>
      <div style={{ borderRadius: 22, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '20px 18px', marginBottom: 16 } as any}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>Structure</div>
        <GI label="Nom de la structure" value={form.structure_name} onChange={(e: any) => u('structure_name', e.target.value)} placeholder="Ex: SAAD Aide a Domicile Loire" />
        <GI label="Numero SIRET" value={form.siret} onChange={(e: any) => u('siret', e.target.value)} placeholder="14 chiffres" />
        <GI label="Adresse de la structure" value={form.saad_address} onChange={(e: any) => u('saad_address', e.target.value)} placeholder="12 rue de la Paix" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 } as any}>
          <GI label="Code postal" value={form.saad_postal_code} onChange={(e: any) => u('saad_postal_code', e.target.value)} placeholder="75002" />
          <GI label="Ville" value={form.saad_city} onChange={(e: any) => u('saad_city', e.target.value)} placeholder="Paris" />
        </div>
        <GI label="Pays" value={form.saad_country} onChange={(e: any) => u('saad_country', e.target.value)} placeholder="France" />
        <GI label="Email professionnel" value={form.saad_email} onChange={(e: any) => u('saad_email', e.target.value)} placeholder="contact@votre-saad.fr" type="email" />
      </div>
      <div style={{ borderRadius: 22, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '20px 18px', marginBottom: 16 } as any}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>Dirigeant</div>
        <GI label="Nom et prenom du dirigeant" value={form.saad_director_name} onChange={(e: any) => u('saad_director_name', e.target.value)} placeholder="Jean Dupont" />
        <div style={{ marginBottom: 14 } as any}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.55)', marginBottom: 6 }}>Telephone</div>
          <div style={{ display: 'flex', gap: 8 } as any}>
            <div style={{ ...INPUT_STYLE, width: 'auto', padding: '13px 12px', borderRadius: 999, display: 'flex', alignItems: 'center', gap: 4 } as any}><span>{PREFIXES.find(p => p.code === form.prefix)?.flag}</span><span style={{ fontWeight: 600 }}>{form.prefix}</span></div>
            <input data-testid="saad-phone" value={form.phone} onChange={(e: any) => u('phone', e.target.value)} placeholder="06 12 34 56 78" style={{ ...INPUT_STYLE, flex: 1 }} />
          </div>
        </div>
      </div>
      <div style={{ borderRadius: 22, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: '20px 18px', marginBottom: 16 } as any}>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>Identifiants de connexion</div>
        <GI label="Mot de passe" type="password" value={form.password} onChange={(e: any) => u('password', e.target.value)} placeholder="6 caracteres minimum" />
        <GI label="Confirmer le mot de passe" type="password" value={form.confirmPassword} onChange={(e: any) => u('confirmPassword', e.target.value)} placeholder="Confirmez" />
      </div>
      <AcceptTerms checked={form.acceptTerms} onToggle={() => u('acceptTerms', !form.acceptTerms)} />
    </>
  );
}
