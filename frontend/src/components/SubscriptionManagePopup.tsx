import React, { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { apiFetch } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const BG_BLUE = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/v5t9l2mb_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_10_07.png';

interface Props {
  show: boolean;
  onClose: () => void;
  subData: any;
  onRefresh: () => void;
}

export default function SubscriptionManagePopup({ show, onClose, subData, onRefresh }: Props) {
  const { token, user } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<'info' | 'housing' | 'guardians' | 'payment'>('info');
  const [guardians, setGuardians] = useState<any[]>([]);
  const [pendingInvites, setPendingInvites] = useState<any[]>([]);
  const [housing, setHousing] = useState({ address: '', postal_code: '', city: '', floor: '', digicode: '', interphone: '', key_box_code: '', housing_notes: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [resending, setResending] = useState('');
  const [showCancel, setShowCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const isCare = subData?.subscription_type === 'care';
  const accent = isCare ? '#A78BFA' : '#3B82F6';

  const fetchData = useCallback(async () => {
    if (!token) return;
    const [g, inv] = await Promise.all([
      apiFetch('/api/guardians/my', {}, token).catch(() => []),
      apiFetch('/api/guardians/pending-invites', {}, token).catch(() => []),
    ]);
    setGuardians(Array.isArray(g) ? g : []);
    setPendingInvites(Array.isArray(inv) ? inv : []);
    // Load housing from subscription
    const sub = subData?.subscription;
    if (sub) {
      setHousing({
        address: sub.address || user?.address || '',
        postal_code: sub.postal_code || user?.postal_code || '',
        city: sub.city || user?.city || '',
        floor: sub.floor || '',
        digicode: sub.digicode || '',
        interphone: sub.interphone || '',
        key_box_code: sub.key_box_code || '',
        housing_notes: sub.housing_notes || '',
      });
    }
  }, [token, subData]);

  useEffect(() => { if (show) fetchData(); }, [show, fetchData]);

  const saveHousing = async () => {
    setSaving(true);
    try {
      await apiFetch('/api/subscriptions/my/update-info', { method: 'PUT', body: JSON.stringify(housing) }, token);
      setSaved(true); setTimeout(() => setSaved(false), 2000);
      onRefresh();
    } catch {} finally { setSaving(false); }
  };

  const resendInvite = async (phone: string) => {
    setResending(phone);
    try {
      await apiFetch('/api/guardians/resend-invite', { method: 'POST', body: JSON.stringify({ phone }) }, token);
    } catch {} finally { setResending(''); }
  };

  const moveGuardian = async (idx: number, dir: number) => {
    const arr = [...guardians];
    const ni = idx + dir;
    if (ni < 0 || ni >= arr.length) return;
    [arr[idx], arr[ni]] = [arr[ni], arr[idx]];
    setGuardians(arr);
    await apiFetch('/api/guardians/reorder', { method: 'POST', body: JSON.stringify({ order: arr.map(g => g.id) }) }, token).catch(() => {});
  };

  const cancelSub = async () => {
    setCancelling(true);
    try {
      await apiFetch('/api/subscriptions/my/cancel', { method: 'POST' }, token);
      onRefresh(); onClose();
    } catch {} finally { setCancelling(false); }
  };

  const openBillingPortal = async () => {
    try {
      const res = await apiFetch('/api/subscriptions/my/billing-portal', { method: 'POST', body: JSON.stringify({ return_url: window.location.href }) }, token);
      if (res.url) window.open(res.url, '_blank');
    } catch {
      window.alert('Le portail de paiement n\'est pas disponible pour cet abonnement.');
    }
  };

  if (!show || Platform.OS !== 'web') return null;

  const sub = subData?.subscription;
  const tabs = isCare
    ? [{ key: 'info', label: 'Abonnement', icon: 'ri-shield-star-line' }, { key: 'housing', label: 'Logement', icon: 'ri-home-4-line' }, { key: 'guardians', label: 'Gardiens', icon: 'ri-group-line' }, { key: 'payment', label: 'Paiement', icon: 'ri-bank-card-line' }]
    : [{ key: 'info', label: 'Abonnement', icon: 'ri-watch-line' }, { key: 'payment', label: 'Paiement', icon: 'ri-bank-card-line' }];

  return (
    <div onClick={onClose} data-testid="subscription-manage-popup" style={{ position: 'fixed', inset: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: isCare ? 'rgba(88,40,200,0.15)' : 'rgba(20,60,140,0.15)', overflowY: 'scroll', WebkitOverflowScrolling: 'touch' } as any}>
      <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '30px 24px 120px', boxSizing: 'border-box' } as any}>

        {/* Close */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 } as any}>
          <div onClick={onClose} style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div>
        </div>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 20 } as any}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: `${accent}25`, border: `1px solid ${accent}40`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 } as any}>
            <i className={isCare ? 'ri-shield-star-line' : 'ri-watch-line'} style={{ fontSize: 32, color: accent }} />
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#FFF' }}>{isCare ? 'Abonnement Care' : 'Bracelet Elio'}</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px', borderRadius: 999, background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.3)', marginTop: 8 } as any}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' } as any} />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#10B981' }}>Actif</span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, padding: 3, borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', marginBottom: 20 } as any}>
          {tabs.map((t: any) => (
            <div key={t.key} data-testid={`tab-${t.key}`} onClick={() => setTab(t.key)} style={{ flex: 1, padding: '10px 6px', borderRadius: 11, cursor: 'pointer', textAlign: 'center', background: tab === t.key ? 'rgba(255,255,255,0.1)' : 'transparent', transition: 'background 0.2s' } as any}>
              <i className={t.icon} style={{ fontSize: 14, color: tab === t.key ? '#FFF' : 'rgba(255,255,255,0.35)', display: 'block', marginBottom: 3 }} />
              <span style={{ fontSize: 10, fontWeight: 700, color: tab === t.key ? '#FFF' : 'rgba(255,255,255,0.35)' }}>{t.label}</span>
            </div>
          ))}
        </div>

        {/* === TAB: INFO === */}
        {tab === 'info' && (
          <div>
            {[
              { icon: 'ri-shield-check-line', label: 'Type', value: isCare ? 'Care — Teleassistance 24/7' : 'Standard — Bracelet Elio' },
              { icon: 'ri-money-euro-circle-line', label: 'Mensualite', value: isCare ? '39,90 EUR/mois' : '24,90 EUR/mois' },
              sub?.beneficiary_phone && { icon: 'ri-phone-line', label: 'Telephone', value: sub.beneficiary_phone },
              (subData?.start_date || sub?.created_at) && { icon: 'ri-calendar-line', label: 'Souscrit le', value: new Date(subData.start_date || sub.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) },
              subData?.source && { icon: 'ri-information-line', label: 'Source', value: subData.source === 'shopify' ? 'Achat en ligne (Shopify)' : subData.source === 'website_contract' ? 'Souscription en ligne' : subData.source === 'manual' ? 'Activation manuelle' : subData.source },
            ].filter(Boolean).map((item: any, i: number, arr: any[]) => (
              <div key={i}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0' } as any}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: `${accent}15`, border: `1px solid ${accent}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                    <i className={item.icon} style={{ fontSize: 15, color: accent }} />
                  </div>
                  <div style={{ flex: 1 } as any}>
                    <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{item.label}</div>
                    <div style={{ fontSize: 13, color: '#FFF', fontWeight: 500, marginTop: 1 }}>{item.value}</div>
                  </div>
                </div>
                {i < arr.length - 1 && <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' } as any} />}
              </div>
            ))}
            {/* Features */}
            <div style={{ marginTop: 16, padding: '14px 16px', borderRadius: 16, background: `${accent}0C`, border: `1px solid ${accent}18` } as any}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>Inclus</div>
              {(isCare
                ? ['Detection de chute', 'Bouton SOS', 'Plateau d\'ecoute 24/7', 'Intervenants Care', 'Suivi GPS', 'Notifications gardiens', 'Rapports']
                : ['Suivi cardiaque', 'SpO2 et temperature', 'Detection de chute', 'Historique sante', 'App mobile']
              ).map((f, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 } as any}>
                  <i className="ri-check-line" style={{ fontSize: 12, color: accent }} />
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>{f}</span>
                </div>
              ))}
            </div>
            {/* Upgrade for standard */}
            {!isCare && (
              <div onClick={() => { onClose(); router.push('/subscription' as any); }} style={{ marginTop: 14, padding: '16px', borderRadius: 16, background: 'rgba(124,92,255,0.1)', border: '1px solid rgba(124,92,255,0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 } as any}>
                <i className="ri-arrow-up-circle-line" style={{ fontSize: 20, color: '#A78BFA' }} />
                <div style={{ flex: 1 } as any}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>Passer a Chutex Care</div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>+15 EUR/mois — Teleassistance 24/7</div>
                </div>
                <i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: '#A78BFA' }} />
              </div>
            )}
          </div>
        )}

        {/* === TAB: HOUSING (Care only) === */}
        {tab === 'housing' && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 14 }}>Informations logement</div>
            {[
              { key: 'address', label: 'Adresse', placeholder: '12 rue de la Paix', icon: 'ri-map-pin-line' },
              { key: 'postal_code', label: 'Code postal', placeholder: '75001', icon: 'ri-mail-line' },
              { key: 'city', label: 'Ville', placeholder: 'Paris', icon: 'ri-building-line' },
              { key: 'floor', label: 'Etage', placeholder: '3eme etage', icon: 'ri-stairs-line' },
              { key: 'digicode', label: 'Digicode', placeholder: 'A1234', icon: 'ri-lock-password-line' },
              { key: 'interphone', label: 'Interphone', placeholder: 'Martin', icon: 'ri-door-lock-line' },
            ].map((f) => (
              <div key={f.key} style={{ marginBottom: 10 } as any}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 } as any}>
                  <i className={f.icon} style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)' }} />
                  <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{f.label}</span>
                </div>
                <input value={(housing as any)[f.key]} onChange={(e: any) => setHousing({ ...housing, [f.key]: e.target.value })} placeholder={f.placeholder}
                  style={{ width: '100%', padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' } as any} />
              </div>
            ))}

            {/* Key Box Code - special highlight */}
            <div style={{ marginTop: 6, padding: '16px', borderRadius: 16, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' } as any}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 } as any}>
                <i className="ri-key-2-line" style={{ fontSize: 16, color: '#F59E0B' }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: '#F59E0B' }}>Code boite a cles</span>
              </div>
              <input value={housing.key_box_code} onChange={(e: any) => setHousing({ ...housing, key_box_code: e.target.value })} placeholder="Ex: 1234"
                style={{ width: '100%', padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(245,158,11,0.25)', color: '#FFF', fontSize: 18, fontWeight: 700, fontFamily: 'inherit', outline: 'none', letterSpacing: 4, textAlign: 'center', boxSizing: 'border-box' } as any} />
              {!housing.key_box_code && (
                <div style={{ fontSize: 11, color: 'rgba(245,158,11,0.6)', marginTop: 8, lineHeight: 1.5 }}>
                  <i className="ri-information-line" style={{ marginRight: 4 }} />
                  Si vous avez achete une boite a cles chez nous, renseignez le code a la livraison.
                </div>
              )}
            </div>

            {/* Notes */}
            <div style={{ marginTop: 12 } as any}>
              <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Notes pour les intervenants</div>
              <textarea value={housing.housing_notes} onChange={(e: any) => setHousing({ ...housing, housing_notes: e.target.value })} placeholder="Informations complementaires..."
                style={{ width: '100%', minHeight: 60, padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'none', boxSizing: 'border-box' } as any} />
            </div>

            {/* Save */}
            <div data-testid="save-housing-btn" onClick={saveHousing} style={{ marginTop: 16, padding: '14px', borderRadius: 999, background: saved ? 'rgba(16,185,129,0.15)' : '#FFF', border: saved ? '1px solid rgba(16,185,129,0.3)' : 'none', cursor: 'pointer', textAlign: 'center', fontSize: 14, fontWeight: 700, color: saved ? '#10B981' : '#111', transition: 'all 0.3s' } as any}>
              {saving ? 'Enregistrement...' : saved ? 'Enregistre !' : 'Enregistrer'}
            </div>
          </div>
        )}

        {/* === TAB: GUARDIANS (Care only) === */}
        {tab === 'guardians' && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 6 }}>Ordre d'escalade teleassistance</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginBottom: 14, lineHeight: 1.5 }}>En cas d'alerte, la teleassistance appellera vos gardiens dans cet ordre.</div>

            {guardians.length > 0 ? guardians.map((g: any, i: number) => (
              <div key={g.id} data-testid={`guardian-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 16, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 8 } as any}>
                <div style={{ width: 32, height: 32, borderRadius: 999, background: `${accent}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: accent }}>{i + 1}</div>
                <div style={{ flex: 1 } as any}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{g.name}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{g.phone} {g.relationship ? `· ${g.relationship}` : ''}</div>
                </div>
                <div style={{ display: 'flex', gap: 4 } as any}>
                  {i > 0 && <div onClick={() => moveGuardian(i, -1)} style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-up-s-line" style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }} /></div>}
                  {i < guardians.length - 1 && <div onClick={() => moveGuardian(i, 1)} style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-arrow-down-s-line" style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)' }} /></div>}
                </div>
              </div>
            )) : (
              <div style={{ padding: '20px', borderRadius: 16, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', textAlign: 'center', marginBottom: 12 } as any}>
                <i className="ri-user-unfollow-line" style={{ fontSize: 28, color: 'rgba(239,68,68,0.4)', display: 'block', marginBottom: 8 }} />
                <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF', marginBottom: 4 }}>Aucun gardien inscrit</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>Vos contacts d'urgence n'ont pas encore cree leur compte gardien.</div>
              </div>
            )}

            {/* Pending invites */}
            {pendingInvites.length > 0 && (
              <div style={{ marginTop: 12 } as any}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>En attente d'inscription</div>
                {pendingInvites.map((inv: any) => (
                  <div key={inv.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 16, background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', marginBottom: 8 } as any}>
                    <div style={{ width: 32, height: 32, borderRadius: 999, background: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><i className="ri-time-line" style={{ fontSize: 14, color: '#F59E0B' }} /></div>
                    <div style={{ flex: 1 } as any}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#FFF' }}>{inv.guardian_name || inv.guardian_phone}</div>
                      <div style={{ fontSize: 10, color: 'rgba(245,158,11,0.6)' }}>SMS envoye — pas encore inscrit</div>
                    </div>
                    <div data-testid={`resend-${inv.guardian_phone}`} onClick={() => resendInvite(inv.guardian_phone)} style={{ padding: '6px 12px', borderRadius: 999, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', cursor: 'pointer', fontSize: 10, fontWeight: 700, color: '#F59E0B' } as any}>
                      {resending === inv.guardian_phone ? '...' : 'Renvoyer'}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add guardian button */}
            <div onClick={() => { onClose(); router.push('/(tabs)' as any); }} style={{ marginTop: 14, padding: '14px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: '#FFF' } as any}>
              <i className="ri-heart-add-line" style={{ fontSize: 16 }} />
              Ajouter un gardien
            </div>
          </div>
        )}

        {/* === TAB: PAYMENT === */}
        {tab === 'payment' && (
          <div>
            {/* Billing portal */}
            <div data-testid="billing-portal-btn" onClick={openBillingPortal} style={{ padding: '16px', borderRadius: 16, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14 } as any}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}><i className="ri-bank-card-line" style={{ fontSize: 20, color: '#3B82F6' }} /></div>
              <div style={{ flex: 1 } as any}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>Moyen de paiement</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Modifier ou mettre a jour votre carte</div>
              </div>
              <i className="ri-external-link-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.3)' }} />
            </div>

            {/* Subscription info */}
            <div style={{ padding: '16px', borderRadius: 16, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 12 } as any}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>Recapitulatif</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 } as any}>
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{isCare ? 'Chutex Care' : 'Bracelet Elio'}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{isCare ? '39,90' : '24,90'} EUR</span>
              </div>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '6px 0' } as any} />
              <div style={{ display: 'flex', justifyContent: 'space-between' } as any}>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.6)' }}>Total mensuel</span>
                <span style={{ fontSize: 15, fontWeight: 900, color: '#FFF' }}>{isCare ? '39,90' : '24,90'} EUR</span>
              </div>
            </div>

            {/* Cancel */}
            {!showCancel ? (
              <div onClick={() => setShowCancel(true)} style={{ padding: '14px', borderRadius: 16, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.1)', cursor: 'pointer', textAlign: 'center', fontSize: 13, fontWeight: 600, color: 'rgba(239,68,68,0.5)', marginTop: 20 } as any}>
                Resilier mon abonnement
              </div>
            ) : (
              <div style={{ marginTop: 20, padding: '18px', borderRadius: 16, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' } as any}>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#EF4444', marginBottom: 8 }}>Confirmer la resiliation ?</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5, marginBottom: 14 }}>
                  {isCare ? 'Vous perdrez l\'acces a la teleassistance 24/7, au suivi GPS et aux intervenants Care.' : 'Vous ne pourrez plus utiliser votre bracelet Elio ni acceder a vos donnees de sante.'}
                </div>
                <div style={{ display: 'flex', gap: 10 } as any}>
                  <div onClick={() => setShowCancel(false)} style={{ flex: 1, padding: '12px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#FFF' } as any}>Annuler</div>
                  <div data-testid="confirm-cancel-btn" onClick={cancelSub} style={{ flex: 1, padding: '12px', borderRadius: 999, background: '#EF4444', cursor: 'pointer', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#FFF' } as any}>{cancelling ? 'Resiliation...' : 'Confirmer'}</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
