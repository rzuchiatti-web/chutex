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

function ProfileGlassPopup({ visible, onClose, children }: any) {
  const { t } = useI18n();
  if (!visible) return null;
  return portalMount(
    <div style={POP as any}>
      <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: '70px 28px 120px', boxSizing: 'border-box' } as any}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}>
          <div onClick={onClose} style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: '#FFF' }} /></div>
        </div>
        {children}
      </div>
    </div>
  );
}

interface RGPDProps {
  visible: boolean;
  onClose: () => void;
  rgpdRight: string;
  setRgpdRight: (v: string) => void;
  rgpdMsg: string;
  setRgpdMsg: (v: string) => void;
  rgpdSending: boolean;
  setRgpdSending: (v: boolean) => void;
  rgpdSent: boolean;
  setRgpdSent: (v: boolean) => void;
  rgpdRef: string;
  setRgpdRef: (v: string) => void;
  apiFetch: any;
  token: string;
}

export function RGPDPopup({ visible, onClose, rgpdRight, setRgpdRight, rgpdMsg, setRgpdMsg, rgpdSending, setRgpdSending, rgpdSent, setRgpdSent, rgpdRef, setRgpdRef, apiFetch, token }: RGPDProps) {
  if (!visible) return null;
  const Alert = require('react-native').Alert;
  return (
    <ProfileGlassPopup visible={visible} onClose={onClose}>
      <div style={{ textAlign: 'center', marginBottom: 24 } as any}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 } as any}>
          <i className="ri-shield-check-line" style={{ fontSize: 28, color: '#38BDF8' }} />
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>Gestion des donnees</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>Exercez vos droits RGPD</div>
      </div>
      {!rgpdSent ? (
        <>
          <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Type de demande</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 } as any}>
            {[
              { key: 'access', label: "Droit d'acces", desc: 'Obtenir une copie de vos donnees personnelles', icon: 'ri-eye-line' },
              { key: 'deletion', label: 'Droit a la suppression', desc: 'Demander l\'effacement de vos donnees', icon: 'ri-delete-bin-line' },
              { key: 'opposition', label: "Droit d'opposition", desc: 'Vous opposer au traitement de vos donnees', icon: 'ri-hand-heart-line' },
              { key: 'portability', label: 'Droit a la portabilite', desc: 'Recevoir vos donnees dans un format structure', icon: 'ri-download-2-line' },
            ].map(r => (
              <div key={r.key} data-testid={`rgpd-right-${r.key}`} onClick={() => setRgpdRight(r.key)} style={{ padding: '14px 16px', borderRadius: 14, background: rgpdRight === r.key ? 'rgba(56,189,248,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${rgpdRight === r.key ? 'rgba(56,189,248,0.3)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 } as any}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: rgpdRight === r.key ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                  <i className={r.icon} style={{ fontSize: 16, color: rgpdRight === r.key ? '#38BDF8' : 'rgba(255,255,255,0.3)' }} />
                </div>
                <div style={{ flex: 1 } as any}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: rgpdRight === r.key ? '#FFF' : 'rgba(255,255,255,0.5)' }}>{r.label}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>{r.desc}</div>
                </div>
                {rgpdRight === r.key && <i className="ri-check-line" style={{ fontSize: 16, color: '#38BDF8' }} />}
              </div>
            ))}
          </div>
          <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Message complementaire (optionnel)</div>
          <textarea value={rgpdMsg} onChange={(e: any) => setRgpdMsg(e.target.value)} placeholder="Precisions sur votre demande..." rows={3} style={{ width: '100%', padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 13, fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box', outline: 'none', marginBottom: 12 } as any} />
          <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 16 } as any}>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>
              Votre demande sera envoyee a <strong style={{ color: 'rgba(255,255,255,0.5)' }}>contact@chutex-innovation.com</strong> avec l'objet : <strong style={{ color: 'rgba(255,255,255,0.5)' }}>RGPD - {{'access': "Droit d'acces", 'deletion': 'Droit a la suppression', 'opposition': "Droit d'opposition", 'portability': 'Droit a la portabilite'}[rgpdRight]}</strong>. Delai legal de reponse : 30 jours maximum.
            </div>
          </div>
          <div data-testid="rgpd-submit-btn" onClick={async () => {
            setRgpdSending(true);
            try {
              const res = await apiFetch('/api/rgpd/request', { method: 'POST', body: JSON.stringify({ right_type: rgpdRight, message: rgpdMsg }) }, token);
              setRgpdRef(res.request_id || '');
              setRgpdSent(true);
            } catch (e: any) { Alert.alert(t('error'), e.message); } finally { setRgpdSending(false); }
          }} style={{ padding: '16px', borderRadius: 999, background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.25)', cursor: rgpdSending ? 'wait' : 'pointer', textAlign: 'center', fontSize: 15, fontWeight: 800, color: '#38BDF8' } as any}>
            {rgpdSending ? 'Envoi en cours...' : 'Envoyer ma demande'}
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center' } as any}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 } as any}>
            <i className="ri-check-double-line" style={{ fontSize: 28, color: '#10B981' }} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF', marginBottom: 8 }}>Demande envoyee</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 16 }}>
            Votre demande a été enregistrée sous la reference <strong style={{ color: '#38BDF8' }}>{rgpdRef}</strong>. Nous vous repondrons sous 30 jours maximum conformement au RGPD.
          </div>
          <div onClick={onClose} style={{ padding: '14px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#FFF' } as any}>Fermer</div>
        </div>
      )}
    </ProfileGlassPopup>
  );
}

export function PrivacyPopup({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <ProfileGlassPopup visible={visible} onClose={onClose}>
      <div style={{ textAlign: 'center', marginBottom: 20 } as any}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 } as any}>
          <i className="ri-file-shield-2-line" style={{ fontSize: 28, color: '#A78BFA' }} />
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>Politique de confidentialite</div>
      </div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, whiteSpace: 'pre-wrap' } as any}>
        {`POLITIQUE DE CONFIDENTIALITÉ - CARE WATCH\n\nDernière mise à jour : Février 2026\n\n1. RESPONSABLE DU TRAITEMENT\nChutex Innovation SAS\nEmail DPO : contact@chutex-innovation.com\n\n2. DONNÉES COLLECTÉES\n- Données d'identification : nom, prénom, email, téléphone\n- Données de santé (Art. 9 RGPD) : fréquence cardiaque, tension, SpO2, température, poids, sommeil, ECG\n- Données de géolocalisation : position GPS\n- Données de connexion : logs, adresse IP\n\n3. FINALITÉS\n- Suivi de santé préventif et personnalisé\n- Détection d'anomalies et alertes\n- Téléassistance et envoi d'intervenants\n- Analyse IA (assistant Nora)\n\n4. BASE LEGALE\n- Consentement explicite (Art. 6.1.a et Art. 9.2.a)\n- Execution du contrat (Art. 6.1.b)\n\n5. DURÉE DE CONSERVATION\n- Données de santé : 5 ans après derniere utilisation\n- Données de compte : durée du contrat + 3 ans\n- Logs : 12 mois\n\n6. DESTINATAIRES\n- Équipe Chutex Innovation\n- Gardiens/prescripteurs désignés\n- Plateaux d'écoute\n- Aucune vente à des tiers\n\n7. VOS DROITS (Art. 15 a 22 RGPD)\nAccès, rectification, effacement, opposition, portabilité, retrait du consentement.\nContact : contact@chutex-innovation.com\nDélai : 30 jours maximum.\n\n8. SÉCURITÉ\nChiffrement, contrôle d'accès, pseudonymisation.\n\n9. RÉCLAMATION CNIL\nwww.cnil.fr`}
      </div>
    </ProfileGlassPopup>
  );
}

export function CGUPopup({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <ProfileGlassPopup visible={visible} onClose={onClose}>
      <div style={{ textAlign: 'center', marginBottom: 20 } as any}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 } as any}>
          <i className="ri-file-text-line" style={{ fontSize: 28, color: '#F59E0B' }} />
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>Conditions generales</div>
      </div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, whiteSpace: 'pre-wrap' } as any}>
        {`CONDITIONS GÉNÉRALES D'UTILISATION - CARE WATCH\n\nDernière mise à jour : Février 2026\n\n1. OBJET\nLes présentes CGU régissent l'utilisation de l'application CARE WATCH éditée par Chutex Innovation SAS.\n\n2. DESCRIPTION DU SERVICE\nCARE WATCH est une application de téléassistance et de suivi de santé préventif : suivi des constantes vitales, détection de chutes, assistance 24/7, recommandations IA.\n\n3. INSCRIPTION\nL'utilisateur fournit des informations exactes et est responsable de la confidentialité de ses identifiants.\n\n4. DONNÉES DE SANTÉ\nL'utilisateur consent explicitement au traitement de ses données de santé. Ce consentement peut être retiré à tout moment.\n\n5. RESPONSABILITÉS\nCARE WATCH est un outil d'aide, pas un substitut médical. Les recommandations IA sont informatives.\n\n6. PROPRIÉTÉ INTELLECTUELLE\nL'application est la propriété de Chutex Innovation SAS.\n\n7. RÉSILIATION\nSuppression du compte possible à tout moment.\n\n8. LOI APPLICABLE\nDroit français. Compétence des tribunaux français.`}
      </div>
    </ProfileGlassPopup>
  );
}

export function MentionsPopup({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  return (
    <ProfileGlassPopup visible={visible} onClose={onClose}>
      <div style={{ textAlign: 'center', marginBottom: 20 } as any}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 } as any}>
          <i className="ri-information-line" style={{ fontSize: 28, color: 'rgba(255,255,255,0.6)' }} />
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>Mentions legales</div>
      </div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, whiteSpace: 'pre-wrap' } as any}>
        {`MENTIONS LEGALES\n\nEDITEUR\nChutex Innovation SAS\nEmail : contact@chutex-innovation.com\nDirecteur de la publication : Chutex Innovation\n\nHEBERGEMENT\nServeurs sécurisés en Europe.\n\nPROPRIÉTÉ INTELLECTUELLE\nL'ensemble du contenu de CARE WATCH est protege par le droit de la propriete intellectuelle.\n\nDONNEES PERSONNELLES\nConformement au RGPD et a la loi Informatique et Libertes, vous disposez de droits sur vos donnees. Consultez notre Politique de confidentialite.\n\nCONTACT DPO\ncontact@chutex-innovation.com\n\nRÉCLAMATION CNIL\nCommission Nationale de l'Informatique et des Libertes\n3 Place de Fontenoy, 75334 Paris\nwww.cnil.fr`}
      </div>
    </ProfileGlassPopup>
  );
}
