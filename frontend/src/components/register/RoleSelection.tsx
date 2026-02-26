import React, { useState } from 'react';

const AVATARS_BEN = [
  { icon: 'ri-user-heart-line', color: '#38BDF8', bg: 'rgba(56,189,248,0.15)', label: 'SENIOR' },
  { icon: 'ri-run-line', color: '#10B981', bg: 'rgba(16,185,129,0.15)', label: 'SPORTIF' },
  { icon: 'ri-men-line', color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)', label: 'HOMME' },
  { icon: 'ri-women-line', color: '#F472B6', bg: 'rgba(244,114,182,0.15)', label: 'FEMME' },
];

const AVATARS_GUARD = [
  { icon: 'ri-heart-line', color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', label: 'FAMILLE' },
  { icon: 'ri-stethoscope-line', color: '#10B981', bg: 'rgba(16,185,129,0.15)', label: 'INFIRMIER' },
  { icon: 'ri-building-2-line', color: '#6366F1', bg: 'rgba(99,102,241,0.15)', label: 'SAP/HAD' },
  { icon: 'ri-shield-star-line', color: '#EC4899', bg: 'rgba(236,72,153,0.15)', label: 'COACH' },
];

function AvatarRow({ items }: { items: typeof AVATARS_BEN }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 18 } as any}>
      {items.map((a, i) => (
        <div key={i} style={{ textAlign: 'center' } as any}>
          <div style={{ width: 52, height: 52, borderRadius: 999, background: a.bg, border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 6px' } as any}>
            <i className={a.icon} style={{ fontSize: 22, color: a.color }} />
          </div>
          <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.5)', letterSpacing: 0.5 }}>{a.label}</div>
        </div>
      ))}
    </div>
  );
}

export default function RoleSelection({ onSelect }: { onSelect: (role: string) => void }) {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 } as any}>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>Choisissez votre espace</div>
        <div onClick={() => setShowHelp(true)} style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 } as any}>
          <i className="ri-question-line" style={{ fontSize: 13 }} />Comment choisir ?
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 } as any}>
        <div data-testid="role-beneficiary" onClick={() => onSelect('beneficiary')} style={{ padding: '24px 16px 20px', borderRadius: 22, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', cursor: 'pointer', textAlign: 'center' } as any}>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', marginBottom: 6 }}>Beneficiaire</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 18, lineHeight: 1.5 }}>Vous souhaitez utiliser ou porter les dispositifs de sante de Chutex.</div>
          <AvatarRow items={AVATARS_BEN} />
        </div>
        <div data-testid="role-guardian" onClick={() => onSelect('guardian')} style={{ padding: '24px 16px 20px', borderRadius: 22, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', cursor: 'pointer', textAlign: 'center' } as any}>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', marginBottom: 6 }}>Gardien</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginBottom: 18, lineHeight: 1.5 }}>Vous etes un aidant ou professionnel souhaitant accompagner un beneficiaire.</div>
          <AvatarRow items={AVATARS_GUARD} />
        </div>
        <div data-testid="role-saad" onClick={() => onSelect('prescriber_company')} style={{ padding: '20px 16px', borderRadius: 22, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', cursor: 'pointer', textAlign: 'center' } as any}>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', marginBottom: 6 }}>Espace SAAD</div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>Vous etes un dirigeant de structure d'aide a domicile (SAAD, SAP, HAD).</div>
        </div>
      </div>

      {showHelp && (
        <div onClick={() => setShowHelp(false)} style={{ position: 'fixed', inset: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 } as any}>
          <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 380, borderRadius: 24, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', padding: '28px 22px' } as any}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 } as any}>
              <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF' }}>Comment choisir ?</div>
              <div onClick={() => setShowHelp(false)} style={{ width: 32, height: 32, borderRadius: 999, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 16, color: '#FFF' }} /></div>
            </div>
            {[
              { title: 'Beneficiaire', desc: 'Vous portez les dispositifs de sante (bracelet, balance) et souhaitez suivre vos constantes vitales au quotidien. Vous etes le patient ou la personne accompagnee.', who: 'Seniors, sportifs, personnes avec pathologies chroniques, toute personne soucieuse de sa sante.' },
              { title: 'Gardien', desc: 'Vous accompagnez un beneficiaire dans son suivi de sante. Vous recevez ses alertes, consultez ses donnees et intervenez en cas de besoin.', who: 'Famille, aidants, infirmiers, medecins, SAP/HAD, coachs sportifs, structures de soins.' },
            ].map((item, i) => (
              <div key={i} style={{ padding: '16px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' } as any}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#FFF', marginBottom: 6 }}>{item.title}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 8 }}>{item.desc}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}><strong style={{ color: 'rgba(255,255,255,0.5)' }}>Pour qui :</strong> {item.who}</div>
              </div>
            ))}
            <div onClick={() => setShowHelp(false)} style={{ marginTop: 16, padding: '14px', borderRadius: 999, background: '#FFF', textAlign: 'center', fontSize: 14, fontWeight: 800, color: '#111', cursor: 'pointer' } as any}>Compris</div>
          </div>
        </div>
      )}
    </>
  );
}
