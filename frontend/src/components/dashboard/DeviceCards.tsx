import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { apiFetch } from '../../services/api';
import { useI18n } from '../../context/I18nContext';
import { useAuth } from '../../context/AuthContext';

interface Props { br: any; sc: any; vs: any; onStartWeighing?: () => void; weighings?: any[]; onRefresh?: () => void; subscription?: any; }

const batteryColor = (pct: number) => pct > 50 ? '#10B981' : pct > 25 ? '#F59E0B' : '#EF4444';
const batteryGrad = (pct: number) => pct > 50 ? 'linear-gradient(90deg, #059669, #10B981)' : pct > 25 ? 'linear-gradient(90deg, #D97706, #F59E0B)' : 'linear-gradient(90deg, #DC2626, #EF4444)';

const BRACELET_STEPS = [
  { icon: 'ri-battery-charge-line', title: 'Chargez votre bracelet', desc: 'Placez le bracelet Elio sur son socle de charge. Attendez que le voyant LED clignote en vert.', tip: 'Le bracelet doit etre charge a au moins 20% pour demarrer l\'appairage.' },
  { icon: 'ri-flashlight-line', title: 'Attendez le voyant bleu', desc: 'Maintenez le bouton lateral enfonce pendant 3 secondes. Attendez que le voyant clignote en bleu.', tip: 'Le voyant bleu clignotant signifie que le bracelet est en mode appairage.' },
  { icon: 'ri-bluetooth-connect-line', title: 'Recherche en cours...', desc: 'Rapprochez le bracelet de votre telephone. L\'appairage Bluetooth va demarrer automatiquement.', tip: 'Assurez-vous que le Bluetooth est active sur votre telephone.' },
];

const VEST_STEPS = [
  { icon: 'ri-shirt-line', title: 'Enfilez le gilet', desc: 'Enfilez le gilet Elder par-dessus vos vetements. Assurez-vous que la fermeture eclair est bien en face avant.', tip: 'Le gilet doit etre porte pres du corps pour une detection optimale des chutes.' },
  { icon: 'ri-ruler-line', title: 'Ajustez les sangles', desc: 'Serrez les sangles laterales pour que le gilet soit bien ajuste a votre taille. Il ne doit pas etre trop lache.', tip: 'Un ajustement correct est essentiel pour le bon fonctionnement des airbags.' },
  { icon: 'ri-power-line', title: 'Activez le gilet', desc: 'Appuyez sur le bouton d\'alimentation situe a l\'avant, en bas du gilet. Un bip sonore confirme l\'activation.', tip: 'Le voyant vert fixe signifie que le gilet est pret. Un voyant rouge signifie que la batterie est faible.' },
  { icon: 'ri-bluetooth-connect-line', title: 'Recherche en cours...', desc: 'Rapprochez votre telephone du gilet. L\'appairage Bluetooth va demarrer automatiquement.', tip: 'Le gilet est detecte sous le nom "Elder-XXXX" dans la liste Bluetooth.' },
];

const SCALE_STEPS = [
  { icon: 'ri-scales-3-line', title: 'Placez la balance', desc: 'Posez la balance sur une surface plane et dure. Evitez les tapis et moquettes.', tip: 'Une surface stable est necessaire pour des mesures precises.' },
  { icon: 'ri-bluetooth-connect-line', title: 'Montez sur la balance', desc: 'Montez pieds nus sur la balance. Elle s\'allume automatiquement et lance la recherche Bluetooth.', tip: 'Restez immobile pendant la mesure pour un resultat optimal.' },
];

export default function DeviceCards({ br, sc, vs, onStartWeighing, weighings = [], onRefresh, subscription }: Props) {
  const [selected, setSelected] = useState<string | null>(null);
  const [pairingDevice, setPairingDevice] = useState<string | null>(null);
  const [pairingStep, setPairingStep] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [showNoSubPopup, setShowNoSubPopup] = useState(false);
  const router = useRouter();
  const { token } = useAuth();
  const { t } = useI18n();
  const needsSub = !subscription?.can_use_bracelet;

  const devices = [
    { id: 'bracelet', name: 'Bracelet Elio', img: 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/2fto1qw7_bracelet_sante_connecte_elio_chutex_care_teleassistance_telealarme%281%29.svg', battery: br.battery, connected: br.connected, paired: br.paired, color: '#22D3EE', link: 'https://chutex-innovation.com/bracelet-elio', steps: BRACELET_STEPS },
    { id: 'scale', name: 'Balance Vita', img: 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/dwmw2i8r_Balance_connecte_Vita_chutex.svg', battery: sc.battery, connected: sc.connected, paired: sc.paired, color: '#A78BFA', link: 'https://chutex-innovation.com/balance-vita', steps: SCALE_STEPS },
    { id: 'vest', name: 'Elder', img: 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/ljh1zzu3_Gilet_Elder_airbag_Chutex.svg', battery: vs.battery, connected: vs.connected, paired: vs.paired, color: '#10B981', link: 'https://chutex-innovation.com/gilet-elder', steps: VEST_STEPS },
  ];

  const getDevice = (id: string) => devices.find(d => d.id === id)!;
  const lastSync = (ts: string) => ts ? new Date(ts).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '--';

  const removeDevice = async (deviceType: string) => {
    setRemoving(true);
    try {
      await apiFetch('/api/devices/remove-by-type', { method: 'POST', body: JSON.stringify({ device_type: deviceType }) }, token);
      setSelected(null);
      onRefresh?.();
    } catch {} finally { setRemoving(false); }
  };

  const startPairing = (deviceId: string) => {
    setPairingDevice(deviceId);
    setPairingStep(0);
    setScanning(false);
  };

  const closePairing = () => {
    setPairingDevice(null);
    setPairingStep(0);
    setScanning(false);
  };

  const launchScan = () => {
    setScanning(true);
    // On real device, BLE scanning would start here
    // On web, we show an animation
  };

  const InfoRow = ({ label, val }: { label: string; val: string }) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' } as any}>
      <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 700, color: '#FFF' }}>{val}</span>
    </div>
  );

  const BatteryBar = ({ pct }: { pct: number }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0' } as any}>
      <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' } as any}>
        <div style={{ height: 8, borderRadius: 4, width: `${pct}%`, background: batteryGrad(pct) } as any} />
      </div>
      <span style={{ fontSize: 14, fontWeight: 900, color: batteryColor(pct), minWidth: 40, textAlign: 'right' }}>{pct}%</span>
    </div>
  );

  const StatusPill = ({ connected }: { connected: boolean }) => (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 16px', borderRadius: 999, background: connected ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', border: `1px solid ${connected ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}` } as any}>
      <span style={{ width: 7, height: 7, borderRadius: 4, background: connected ? '#10B981' : '#EF4444' } as any} />
      <span style={{ fontSize: 12, fontWeight: 700, color: connected ? '#10B981' : '#EF4444' }}>{connected ? 'Actif' : 'Inactif'}</span>
    </div>
  );

  /* ──── Glass overlay wrapper ──── */
  const GlassOverlay = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.4)', overflowY: 'auto', animation: 'glassIn 0.3s ease' } as any}>
      <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '40px 24px 120px', boxSizing: 'border-box' } as any}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 } as any}>
          <div data-testid="close-popup" onClick={onClose} style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
            <i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} />
          </div>
        </div>
        {children}
      </div>
      <style dangerouslySetInnerHTML={{ __html: '@keyframes glassIn{from{opacity:0}to{opacity:1}} @keyframes pulseRing{0%{transform:scale(1);opacity:0.4}100%{transform:scale(2.5);opacity:0}} @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}' }} />
    </div>
  );

  /* ──── Pairing popup content ──── */
  const PairingPopup = () => {
    if (!pairingDevice) return null;
    const dev = getDevice(pairingDevice);
    const steps = dev.steps;
    const current = steps[pairingStep];
    const isLast = pairingStep === steps.length - 1;

    if (scanning) {
      return (
        <GlassOverlay onClose={closePairing}>
          <div data-testid="scanning-view" style={{ textAlign: 'center' } as any}>
            <img src={dev.img} alt="" style={{ width: 100, height: 100, objectFit: 'contain', margin: '0 auto 24px', display: 'block' } as any} />
            {/* Scanning animation */}
            <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 28px' } as any}>
              <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `2px solid ${dev.color}`, opacity: 0.3, animation: 'pulseRing 1.5s ease-out infinite' } as any} />
              <div style={{ position: 'absolute', inset: 8, borderRadius: '50%', border: `2px solid ${dev.color}`, opacity: 0.3, animation: 'pulseRing 1.5s ease-out infinite 0.5s' } as any} />
              <div style={{ position: 'absolute', inset: 16, borderRadius: '50%', background: `${dev.color}15`, border: `2px solid ${dev.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                <i className="ri-bluetooth-connect-line" style={{ fontSize: 22, color: dev.color, animation: 'spin 2s linear infinite' }} />
              </div>
            </div>
            <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF', marginBottom: 8 }}>Recherche en cours...</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 32, lineHeight: 1.5 }}>Rapprochez votre {dev.name} de votre telephone.<br />L'appairage va demarrer automatiquement.</div>
            <div style={{ padding: '14px 18px', borderRadius: 16, background: `${dev.color}08`, border: `1px solid ${dev.color}18`, marginBottom: 24 } as any}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 } as any}>
                <i className="ri-information-line" style={{ fontSize: 16, color: dev.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>Assurez-vous que le Bluetooth est active sur votre telephone et que l'appareil est a proximite.</span>
              </div>
            </div>
            <div data-testid="cancel-scan" onClick={closePairing} style={{ padding: '14px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', textAlign: 'center', fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.5)' } as any}>Annuler</div>
          </div>
        </GlassOverlay>
      );
    }

    return (
      <GlassOverlay onClose={closePairing}>
        <div data-testid={`pairing-popup-${pairingDevice}`} style={{ textAlign: 'center' } as any}>
          {/* Device image */}
          <img src={dev.img} alt="" style={{ width: 100, height: 100, objectFit: 'contain', margin: '0 auto 20px', display: 'block', filter: `drop-shadow(0 8px 24px ${dev.color}30)` } as any} />

          {/* Step indicator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 28 } as any}>
            {steps.map((_: any, i: number) => (
              <div key={i} style={{ height: 4, borderRadius: 2, width: i === pairingStep ? 24 : 12, background: i === pairingStep ? dev.color : i < pairingStep ? `${dev.color}66` : 'rgba(255,255,255,0.1)', transition: 'all 0.3s' } as any} />
            ))}
          </div>

          {/* Step content */}
          <div style={{ width: 52, height: 52, borderRadius: 14, background: `${dev.color}15`, border: `1px solid ${dev.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' } as any}>
            <i className={current.icon} style={{ fontSize: 24, color: dev.color }} />
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: `${dev.color}80`, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 6 }}>Etape {pairingStep + 1}/{steps.length}</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF', marginBottom: 10, lineHeight: 1.3 }}>{current.title}</div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, maxWidth: 300, margin: '0 auto 24px' }}>{current.desc}</div>

          {/* Tip */}
          <div style={{ padding: '14px 18px', borderRadius: 16, background: `${dev.color}08`, border: `1px solid ${dev.color}18`, marginBottom: 28, textAlign: 'left' } as any}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 } as any}>
              <i className="ri-information-line" style={{ fontSize: 16, color: dev.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{current.tip}</span>
            </div>
          </div>

          {/* Navigation */}
          <div style={{ display: 'flex', gap: 10 } as any}>
            {pairingStep > 0 && (
              <div data-testid="pairing-prev" onClick={() => setPairingStep(pairingStep - 1)} style={{ flex: 1, padding: '14px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', textAlign: 'center', fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.5)', transition: 'background 0.2s' } as any}
                onMouseEnter={(e: any) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                onMouseLeave={(e: any) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
              >Retour</div>
            )}
            <div data-testid="pairing-next" onClick={() => isLast ? launchScan() : setPairingStep(pairingStep + 1)} style={{ flex: 1, padding: '14px', borderRadius: 999, background: isLast ? `linear-gradient(135deg, ${dev.color}CC, ${dev.color})` : '#FFF', cursor: 'pointer', textAlign: 'center', fontSize: 14, fontWeight: 700, color: isLast ? '#FFF' : '#111', boxShadow: isLast ? `0 4px 20px ${dev.color}40` : 'none', transition: 'transform 0.2s' } as any}
              onMouseEnter={(e: any) => e.currentTarget.style.transform = 'translateY(-1px)'}
              onMouseLeave={(e: any) => e.currentTarget.style.transform = ''}
            >{isLast ? 'Lancer le scan' : 'Suivant'}</div>
          </div>
        </div>
      </GlassOverlay>
    );
  };

  return (
    <>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(79,195,247,0.5)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 10 }}>{t('devices_connected')}</div>
      {devices.map((d) => (
        <div key={d.id} data-testid={`device-card-${d.id}`} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 18, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 8, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', transition: 'transform 0.2s' } as any}>
          <img src={d.img} alt="" style={{ width: 48, height: 48, objectFit: 'contain', flexShrink: 0 } as any} />
          <div style={{ flex: 1, minWidth: 0 } as any}>
            <div style={{ fontSize: 14, fontWeight: 800, color: '#FFF', marginBottom: 3 }}>{d.name}</div>
            {d.paired ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 } as any}>
                  <span style={{ width: 6, height: 6, borderRadius: 3, background: d.connected ? '#10B981' : '#EF4444' } as any} />
                  <span style={{ fontSize: 10, fontWeight: 600, color: d.connected ? '#10B981' : '#EF4444' }}>{d.connected ? 'Connecte' : 'Deconnecte'}</span>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden', marginTop: 6 } as any}><div style={{ height: 4, borderRadius: 2, width: `${d.battery}%`, background: batteryGrad(d.battery) } as any} /></div>
              </>
            ) : (
              <div style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.3)' }}>Non associe</div>
            )}
          </div>
          {d.paired ? (
            <div onClick={() => setSelected(d.id)} style={{ fontSize: 14, fontWeight: 900, color: batteryColor(d.battery), flexShrink: 0, cursor: 'pointer' }}>{d.battery}%</div>
          ) : (
            <div style={{ flexShrink: 0 } as any}>
              <div data-testid={`associate-${d.id}`} onClick={() => {
                if (d.id === 'bracelet' && needsSub) { setShowNoSubPopup(true); return; }
                if (d.id === 'scale') { onStartWeighing?.(); return; }
                startPairing(d.id);
              }} style={{ padding: '6px 14px', borderRadius: 999, background: '#FFF', cursor: 'pointer', fontSize: 11, fontWeight: 700, color: '#111', transition: 'opacity 0.2s', opacity: d.id === 'bracelet' && needsSub ? 0.5 : 1 } as any}
              >{d.id === 'scale' ? 'Nouvelle pesee' : 'Associer'}</div>
            </div>
          )}
        </div>
      ))}

      {/* ──── Pairing Flow Popup ──── */}
      <PairingPopup />

      {/* ──── BRACELET Dashboard ──── */}
      {selected === 'bracelet' && (
        <GlassOverlay onClose={() => setSelected(null)}>
          <div style={{ textAlign: 'center', marginBottom: 20 } as any}>
            <img src={devices[0].img} alt="" style={{ width: 100, height: 100, objectFit: 'contain', margin: '0 auto 14px', display: 'block' } as any} />
            <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', marginBottom: 8 }}>Bracelet Elio</div>
            <StatusPill connected={br.connected} />
          </div>
          <div style={{ padding: '4px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 12 } as any}>
            <InfoRow label="Nom" val="Bracelet Elio" />
            <InfoRow label="Derniere connexion" val={lastSync(br.last_sync)} />
          </div>
          <div style={{ padding: '4px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 16 } as any}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5, padding: '10px 0 4px' }}>Batterie</div>
            <BatteryBar pct={br.battery} />
          </div>
          {br.connected ? (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 } as any}>
                <div onClick={() => { setSelected(null); router.push('/bracelet-connect' as any); }} style={{ flex: 1, padding: '14px', borderRadius: 999, background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.2)', cursor: 'pointer', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#22D3EE' } as any}><i className="ri-refresh-line" style={{ marginRight: 6 }} />Synchroniser</div>
                <div onClick={() => { setSelected(null); router.push('/ecg' as any); }} style={{ flex: 1, padding: '14px', borderRadius: 999, background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)', cursor: 'pointer', textAlign: 'center', fontSize: 13, fontWeight: 700, color: '#F97316' } as any}><i className="ri-pulse-line" style={{ marginRight: 6 }} />ECG</div>
              </div>
              <div onClick={() => removeDevice('bracelet')} style={{ padding: '12px', borderRadius: 999, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)', cursor: 'pointer', textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'rgba(239,68,68,0.5)' } as any}>{removing ? 'Suppression...' : 'Supprimer l\'appareil'}</div>
            </>
          ) : (
            <div onClick={() => { setSelected(null); startPairing('bracelet'); }} style={{ padding: '14px', borderRadius: 999, background: '#FFF', cursor: 'pointer', textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#111' } as any}><i className="ri-bluetooth-connect-line" style={{ marginRight: 6 }} />Rechercher et associer</div>
          )}
        </GlassOverlay>
      )}

      {/* ──── GILET Dashboard ──── */}
      {selected === 'vest' && (
        <GlassOverlay onClose={() => setSelected(null)}>
          <div style={{ textAlign: 'center', marginBottom: 20 } as any}>
            <img src={devices[2].img} alt="" style={{ width: 100, height: 100, objectFit: 'contain', margin: '0 auto 14px', display: 'block' } as any} />
            <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', marginBottom: 8 }}>Elder</div>
            <StatusPill connected={vs.connected} />
          </div>
          <div style={{ padding: '4px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 12 } as any}>
            <InfoRow label="Nom" val="Elder" />
            <InfoRow label="Derniere connexion" val={lastSync(vs.last_sync)} />
          </div>
          <div style={{ padding: '4px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 16 } as any}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5, padding: '10px 0 4px' }}>Batterie</div>
            <BatteryBar pct={vs.battery} />
          </div>
          {vs.connected ? (
            <div onClick={() => removeDevice('vest')} style={{ padding: '12px', borderRadius: 999, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)', cursor: 'pointer', textAlign: 'center', fontSize: 12, fontWeight: 600, color: 'rgba(239,68,68,0.5)' } as any}>{removing ? 'Suppression...' : 'Supprimer l\'appareil'}</div>
          ) : (
            <div onClick={() => { setSelected(null); startPairing('vest'); }} style={{ padding: '14px', borderRadius: 999, background: '#FFF', cursor: 'pointer', textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#111' } as any}><i className="ri-bluetooth-connect-line" style={{ marginRight: 6 }} />Rechercher et associer</div>
          )}
        </GlassOverlay>
      )}

      {/* ──── BALANCE Dashboard ──── */}
      {selected === 'scale' && (
        <GlassOverlay onClose={() => setSelected(null)}>
          <div style={{ textAlign: 'center', marginBottom: 20 } as any}>
            <img src={devices[1].img} alt="" style={{ width: 100, height: 100, objectFit: 'contain', margin: '0 auto 14px', display: 'block' } as any} />
            <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', marginBottom: 4 }}>Balance Lefu</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)' }}>Balance 8 electrodes — composition corporelle complete</div>
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Dernieres pesees</div>
          {weighings.length > 0 ? weighings.slice(0, 5).map((w: any, i: number) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 6 } as any}>
              <div style={{ flex: 1 } as any}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#FFF' }}>{w.weight} kg</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{new Date(w.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              <span style={{ padding: '4px 10px', borderRadius: 999, background: w.status === 'Bonne' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)', fontSize: 10, fontWeight: 700, color: w.status === 'Bonne' ? '#10B981' : '#F59E0B' }}>{w.status}</span>
            </div>
          )) : (
            <div style={{ padding: '20px', textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.25)' } as any}>Aucune pesee enregistree</div>
          )}
          <div onClick={() => { setSelected(null); setTimeout(() => onStartWeighing?.(), 100); }} style={{ marginTop: 12, padding: '14px', borderRadius: 999, background: '#FFF', cursor: 'pointer', textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#111' } as any}>
            <i className="ri-scales-3-line" style={{ marginRight: 6 }} />Nouvelle pesee
          </div>
        </GlassOverlay>
      )}
      {/* ──── No Subscription Popup (bracelet) — landing page style ──── */}
      {showNoSubPopup && (
        <GlassOverlay onClose={() => setShowNoSubPopup(false)}>
          <div style={{ textAlign: 'center', marginBottom: 24 } as any}>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', marginBottom: 8 }}>Abonnement requis</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>Pour associer votre bracelet Elio, choisissez votre formule.</div>
          </div>

          {/* Standard Card */}
          <div onClick={() => { setShowNoSubPopup(false); if (typeof window !== 'undefined') window.open('https://chutex-innovation.com/products/elio-smart-health-bracelet', '_blank'); }}
            style={{ padding: '20px', borderRadius: 20, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', marginBottom: 14, cursor: 'pointer', transition: 'border-color 0.2s', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' } as any}
            onMouseEnter={(e: any) => e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)'}
            onMouseLeave={(e: any) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' } as any}>
              <div style={{ width: 72, height: 72, borderRadius: 16, background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                <img src="https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/2fto1qw7_bracelet_sante_connecte_elio_chutex_care_teleassistance_telealarme%281%29.svg" alt="" style={{ width: 56, height: 56, objectFit: 'contain' } as any} />
              </div>
              <div style={{ flex: 1 } as any}>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#FFF', marginBottom: 6 }}>Bracelet Elio</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>Suivi cardiaque, SpO2, temperature, detection de chute.</div>
              </div>
            </div>
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'baseline', gap: 6 } as any}>
              <span style={{ fontSize: 28, fontWeight: 900, color: '#3B82F6' }}>24,90</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>EUR/mois</span>
            </div>
            <div style={{ fontSize: 12, color: '#10B981', marginTop: 4 }}>soit 12,45 EUR apres credit d'impot*</div>
          </div>

          {/* Care Card */}
          <div onClick={() => { setShowNoSubPopup(false); router.push('/subscription' as any); }}
            style={{ padding: '20px', borderRadius: 20, background: 'linear-gradient(135deg, rgba(124,92,255,0.1), rgba(167,139,250,0.04))', border: '1px solid rgba(124,92,255,0.25)', marginBottom: 14, cursor: 'pointer', position: 'relative', transition: 'border-color 0.2s', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' } as any}
            onMouseEnter={(e: any) => e.currentTarget.style.borderColor = 'rgba(124,92,255,0.5)'}
            onMouseLeave={(e: any) => e.currentTarget.style.borderColor = 'rgba(124,92,255,0.25)'}>
            <div style={{ position: 'absolute', top: 12, right: 14, padding: '4px 12px', borderRadius: 999, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)' } as any}>
              <span style={{ fontSize: 9, fontWeight: 700, color: '#10B981', textTransform: 'uppercase', letterSpacing: 0.5 }}>Recommande</span>
            </div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' } as any}>
              <div style={{ width: 72, height: 72, borderRadius: 16, background: 'rgba(124,92,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                <img src="https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/2fto1qw7_bracelet_sante_connecte_elio_chutex_care_teleassistance_telealarme%281%29.svg" alt="" style={{ width: 56, height: 56, objectFit: 'contain' } as any} />
              </div>
              <div style={{ flex: 1 } as any}>
                <div style={{ fontSize: 17, fontWeight: 800, color: '#FFF', marginBottom: 6 }}>Chutex Care</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>Bracelet connecte avec teleassistance 24h/24, 7j/7. Detection de chute, bouton SOS.</div>
              </div>
            </div>
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'baseline', gap: 6 } as any}>
              <span style={{ fontSize: 28, fontWeight: 900, color: '#A78BFA' }}>39,90</span>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)' }}>EUR/mois</span>
            </div>
            <div style={{ fontSize: 12, color: '#10B981', marginTop: 4 }}>soit 19,95 EUR apres credit d'impot*</div>
          </div>

          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', textAlign: 'center', lineHeight: 1.5, marginTop: 4 }}>*Credit d'impot de 50% au titre des services a la personne (art. 199 sexdecies du CGI).<br/>Si vous avez deja souscrit, votre abonnement sera detecte automatiquement.</div>
        </GlassOverlay>
      )}
    </>
  );
}
