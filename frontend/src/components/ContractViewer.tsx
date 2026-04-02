import React from 'react';

interface ContractViewerProps {
  show: boolean;
  onClose: () => void;
  subData: any;
  isCare: boolean;
}

export default function ContractViewer({ show, onClose, subData, isCare }: ContractViewerProps) {
  if (!show) return null;

  const ct = subData?.contract || {};
  const sub = subData?.subscription;
  const contractNumber = ct.contract_number || 'CHX-' + (sub?.id || 'XXXXXX').slice(-6).toUpperCase();
  const planLabel = ct.plan_label || (isCare ? 'Chutex Care — Teleassistance 24/7' : 'Bracelet Elio — Suivi sante');
  const price = ct.price_monthly || (isCare ? 39.90 : 24.90);
  const priceCredit = ct.price_after_credit;
  const startDate = subData?.start_date || sub?.created_at;
  const formattedDate = startDate ? new Date(startDate).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '--';

  const beneficiary = ct.beneficiary || {};
  const benName = beneficiary.first_name && beneficiary.last_name
    ? `${beneficiary.first_name} ${beneficiary.last_name}`
    : sub?.beneficiary_name || '--';
  const benPhone = beneficiary.phone || sub?.beneficiary_phone || '--';
  const benAddress = [beneficiary.address, beneficiary.postal_code, beneficiary.city].filter(Boolean).join(', ') || '--';

  const housing = ct.housing || {};

  const glass = { backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' };

  const SectionTitle = ({ children }: { children: string }) => (
    <div style={{ fontSize: 11, fontWeight: 800, color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 28, marginBottom: 12 }}>{children}</div>
  );

  const ArticleTitle = ({ num, title }: { num: string; title: string }) => (
    <div style={{ fontSize: 13, fontWeight: 800, color: '#FFF', marginTop: 18, marginBottom: 8 }}>{num} — {title}</div>
  );

  const Paragraph = ({ children }: { children: React.ReactNode }) => (
    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.7, marginBottom: 8 }}>{children}</div>
  );

  const BulletList = ({ items }: { items: string[] }) => (
    <div style={{ marginBottom: 8 } as any}>
      {items.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 4 } as any}>
          <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, marginTop: 3, flexShrink: 0 }}>&#9679;</span>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6 }}>{item}</span>
        </div>
      ))}
    </div>
  );

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' } as any}>
      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 600, color: '#FFF', textAlign: 'right', maxWidth: '60%' }}>{value}</span>
    </div>
  );

  return (
    <div data-testid="contract-viewer" style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden', background: '#0A0A0F' } as any}>
      {/* Subtle gradient bg */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 200, background: 'linear-gradient(180deg, rgba(59,130,246,0.08) 0%, transparent 100%)', zIndex: 0 } as any} />

      {/* Header */}
      <div style={{ position: 'relative', zIndex: 10, padding: '70px 20px 12px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.06)' } as any}>
        <div onClick={onClose} data-testid="contract-close-btn" style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 } as any}>
          <i className="ri-arrow-left-s-line" style={{ fontSize: 18, color: '#FFF' }} />
        </div>
        <div style={{ flex: 1 } as any}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#FFF' }}>Contrat d'abonnement</div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>N° {contractNumber} — Lecture seule</div>
        </div>
        <div style={{ padding: '4px 10px', borderRadius: 999, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.2)' } as any}>
          <span style={{ fontSize: 9, fontWeight: 700, color: '#3B82F6', textTransform: 'uppercase', letterSpacing: 0.5 }}>Lecture seule</span>
        </div>
      </div>

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, WebkitOverflowScrolling: 'touch' } as any}>
        <div style={{ width: '100%', maxWidth: 440, margin: '0 auto', padding: '20px 22px 80px', boxSizing: 'border-box' } as any}>

          {/* Contract header card */}
          <div style={{ padding: '20px', borderRadius: 18, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 16, ...glass } as any}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 } as any}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: isCare ? 'rgba(167,139,250,0.12)' : 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                <i className={isCare ? 'ri-shield-star-line' : 'ri-watch-line'} style={{ fontSize: 24, color: isCare ? '#A78BFA' : '#3B82F6' }} />
              </div>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#FFF' }}>{planLabel}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Contrat a duree indeterminee</div>
              </div>
            </div>
            <InfoRow label="Date de souscription" value={formattedDate} />
            <InfoRow label="Souscripteur" value={benName} />
            <InfoRow label="Telephone" value={benPhone} />
            {benAddress !== '--' && <InfoRow label="Adresse" value={benAddress} />}
          </div>

          {/* ARTICLES */}
          <SectionTitle>Conditions generales</SectionTitle>

          <ArticleTitle num="Article 1" title="Objet du contrat" />
          <Paragraph>
            Le present contrat a pour objet la mise a disposition par Chutex Innovation d'un service de {isCare ? 'teleassistance et de suivi sante a domicile' : 'suivi sante connecte'} au benefice du souscripteur, comprenant la fourniture d'equipements connectes et l'acces a la plateforme Chutex.
          </Paragraph>

          <ArticleTitle num="Article 2" title="Description des prestations" />
          {isCare ? (
            <>
              <Paragraph>Dans le cadre de l'abonnement Chutex Care, le prestataire s'engage a fournir :</Paragraph>
              <BulletList items={[
                'Un bracelet connecte Elio V8 avec detection automatique de chute, bouton SOS, suivi cardiaque, SpO2, temperature et GPS',
                'Un service de teleassistance 24h/24 et 7j/7 avec plateau d\'ecoute professionnel',
                'La gestion des interventions d\'urgence avec envoi de secours si necessaire',
                'Le suivi sante en temps reel avec alertes automatiques aux gardiens designes',
                'L\'acces a l\'application mobile Chutex pour le beneficiaire et ses gardiens',
                'Les programmes de prevention sante personnalises par intelligence artificielle',
                'Un service de teleconsultation medicale',
              ]} />
            </>
          ) : (
            <>
              <Paragraph>Dans le cadre de l'abonnement Bracelet Elio, le prestataire s'engage a fournir :</Paragraph>
              <BulletList items={[
                'Un bracelet connecte Elio V8 avec suivi cardiaque, SpO2, temperature et detection de chute',
                'L\'acces a l\'application mobile Chutex pour la visualisation des donnees de sante',
                'Les programmes de prevention sante personnalises par intelligence artificielle',
                'L\'historique complet des donnees de sante',
              ]} />
            </>
          )}

          <ArticleTitle num="Article 3" title="Equipements fournis" />
          <Paragraph>
            Les equipements mis a disposition dans le cadre du present contrat restent la propriete exclusive de Chutex Innovation. Le souscripteur s'engage a en prendre soin et a les restituer en bon etat en cas de resiliation du contrat.
          </Paragraph>
          <BulletList items={[
            'Bracelet connecte Elio V8',
            'Station de charge magnetique',
            ...(isCare ? ['Boitier relais domicile (si applicable)'] : []),
          ]} />

          <ArticleTitle num="Article 4" title="Tarification" />
          <div style={{ padding: '14px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 8, ...glass } as any}>
            <InfoRow label="Mensualite" value={`${price.toFixed(2).replace('.', ',')} EUR/mois`} />
            {priceCredit && <InfoRow label="Apres credit d'impot 50%" value={`${priceCredit.toFixed(2).replace('.', ',')} EUR/mois`} />}
            <InfoRow label="Frequence" value="Prelevement mensuel" />
            <InfoRow label="Moyen de paiement" value="Carte bancaire (Stripe)" />
          </div>
          {isCare && (
            <Paragraph>
              Conformement a l'article 199 sexdecies du Code general des impots, les services fournis dans le cadre du present contrat ouvrent droit a un credit d'impot de 50% au titre des services a la personne.
            </Paragraph>
          )}

          <ArticleTitle num="Article 5" title="Duree et resiliation" />
          <Paragraph>
            Le present contrat est conclu pour une duree indeterminee. Il prend effet a la date de souscription indiquee ci-dessus.
          </Paragraph>
          <Paragraph>
            Chaque partie peut resilier le contrat a tout moment, sous reserve du respect d'un preavis de 30 (trente) jours. La demande de resiliation peut etre effectuee :
          </Paragraph>
          <BulletList items={[
            'Depuis l\'application Chutex (rubrique Mon abonnement)',
            'Par email a contact@chutex-innovation.com',
            'Par courrier recommande avec accuse de reception',
          ]} />
          <Paragraph>
            En cas de resiliation, le souscripteur s'engage a restituer l'ensemble des equipements mis a disposition dans un delai de 30 jours ouvrables. Le numero de suivi du colis de retour devra etre communique a contact@chutex-innovation.com.
          </Paragraph>

          <ArticleTitle num="Article 6" title="Protection des donnees personnelles" />
          <Paragraph>
            Chutex Innovation s'engage a traiter les donnees personnelles du souscripteur et du beneficiaire conformement au Reglement General sur la Protection des Donnees (RGPD). Les donnees de sante collectees par les equipements connectes sont stockees de maniere securisee et ne sont accessibles qu'au beneficiaire, a ses gardiens designes et, en cas d'urgence, au plateau de teleassistance.
          </Paragraph>
          <Paragraph>
            Le souscripteur dispose d'un droit d'acces, de rectification, d'effacement et de portabilite de ses donnees. Pour exercer ces droits, il peut contacter le Delegue a la Protection des Donnees a l'adresse dpo@chutex-innovation.com.
          </Paragraph>

          <ArticleTitle num="Article 7" title="Responsabilites" />
          <Paragraph>
            Chutex Innovation s'engage a assurer la continuite du service dans les meilleures conditions. Toutefois, le prestataire ne saurait etre tenu responsable en cas d'interruption du service due a un cas de force majeure, a une defaillance du reseau mobile ou internet, ou a une utilisation non conforme des equipements.
          </Paragraph>
          {isCare && (
            <Paragraph>
              Le service de teleassistance ne se substitue en aucun cas aux services d'urgence (SAMU, pompiers). En cas de detection d'une situation d'urgence, le plateau d'ecoute contactera les services competents.
            </Paragraph>
          )}

          <ArticleTitle num="Article 8" title="Droit applicable et litiges" />
          <Paragraph>
            Le present contrat est soumis au droit francais. En cas de litige, les parties s'engagent a rechercher une solution amiable. A defaut, le litige sera porte devant les tribunaux competents du ressort du siege social de Chutex Innovation.
          </Paragraph>

          {/* Housing info if available */}
          {isCare && (housing.floor || housing.digicode || housing.interphone) && (
            <>
              <SectionTitle>Informations logement</SectionTitle>
              <div style={{ padding: '14px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', ...glass } as any}>
                {housing.floor && <InfoRow label="Etage" value={housing.floor} />}
                {housing.digicode && <InfoRow label="Digicode" value={housing.digicode} />}
                {housing.interphone && <InfoRow label="Interphone" value={housing.interphone} />}
                {housing.key_box_code && <InfoRow label="Boite a cles" value={housing.key_box_code} />}
              </div>
            </>
          )}

          {/* Guardians if available */}
          {isCare && (ct.contract_guardians || []).length > 0 && (
            <>
              <SectionTitle>Gardiens designes</SectionTitle>
              {ct.contract_guardians.map((g: any, i: number) => (
                <div key={i} style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 8, ...glass } as any}>
                  <InfoRow label="Nom" value={`${g.first_name || ''} ${g.last_name || ''}`} />
                  <InfoRow label="Telephone" value={g.phone || '--'} />
                  {g.relationship && <InfoRow label="Lien" value={g.relationship} />}
                </div>
              ))}
            </>
          )}

          {/* Footer */}
          <div style={{ marginTop: 32, padding: '16px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' } as any}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>Chutex Innovation SAS</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', lineHeight: 1.6 }}>
              Service d'aide a la personne agree<br/>
              contact@chutex-innovation.com
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
