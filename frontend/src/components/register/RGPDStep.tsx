import React from 'react';

export default function RGPDStep() {
  return (
    <div style={{ borderRadius: 22, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', padding: '28px 22px' } as any}>
      <div style={{ textAlign: 'center', marginBottom: 24 } as any}>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', marginBottom: 6 }}>Protection de vos donnees</div>
        <div style={{ width: 40, height: 1, background: 'rgba(255,255,255,0.15)', margin: '0 auto 12px' } as any} />
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>Vos informations de sante sont traitees avec le plus haut niveau de securite.</div>
      </div>
      {[
        { icon: 'ri-server-line', title: 'Hebergement HDS Classe 6', desc: 'Donnees stockees en France sur des serveurs certifies Hebergeur de Donnees de Sante, le standard le plus eleve.' },
        { icon: 'ri-eu-line', title: 'Conformite RGPD', desc: 'Traitement conforme au Reglement General sur la Protection des Donnees. Vos droits sont garantis.' },
        { icon: 'ri-lock-line', title: 'Chiffrement de bout en bout', desc: 'Toutes les communications sont chiffrees. Personne ne peut acceder a vos donnees sans votre accord.' },
        { icon: 'ri-eye-off-line', title: 'Aucun partage non consenti', desc: 'Vos donnees ne sont jamais vendues ni partagees a des tiers sans votre consentement explicite.' },
      ].map((item, i) => (
        <div key={i} style={{ padding: '14px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none', display: 'flex', gap: 12, alignItems: 'flex-start' } as any}>
          <i className={item.icon} style={{ fontSize: 18, color: 'rgba(255,255,255,0.7)', flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF', marginBottom: 4 }}>{item.title}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>{item.desc}</div>
          </div>
        </div>
      ))}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '6px 0 16px' } as any} />
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', lineHeight: 1.6, textAlign: 'center' }}>
        Contact DPO : contact@chutex-innovation.com<br />
        Politique de confidentialite disponible dans votre profil.
      </div>
    </div>
  );
}
