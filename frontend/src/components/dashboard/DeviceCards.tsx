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
  const [pairingDevice, setPairingDevice] = useState<string | null>(null);
  const [pairingStep, setPairingStep] = useState(0);
  const [scanning, setScanning] = useState(false);
  const [showNoSubPopup, setShowNoSubPopup] = useState(false);
  const router = useRouter();
  const { token } = useAuth();
  const { t } = useI18n();
  const needsSub = !subscription?.can_use_bracelet;

  const devices = [
    { id: 'bracelet', name: 'Bracelet Elio', img: 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/2fto1qw7_bracelet_sante_connecte_elio_chutex_care_teleassistance_telealarme%281%29.svg', battery: br.battery, connected: br.connected, paired: br.paired, color: '#22D3EE', link: 'https://chutex-innovation.com/bracelet-elio', steps: BRACELET_STEPS },
    { id: 'scale', name: 'Balance Vita', img: 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/dwmw2i8r_Balance_connecte_Vita_chutex.svg', battery: sc.battery, connected: sc.connected, paired: sc.paired, color: '#A78BFA', link: 'https://chutex-innovation.com/balance-vita', steps: SCALE_STEPS },
    { id: 'vest', name: 'Elder', img: 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/ljh1zzu3_Gilet_Elder_airbag_Chutex.svg', battery: vs.battery, connected: vs.connected, paired: vs.paired, color: '#F59E0B', link: 'https://chutex-innovation.com/gilet-elder', steps: VEST_STEPS },
  ];

  // Only show connected/paired devices on dashboard — balance only if has weighings
  const connectedDevices = devices.filter(d => {
    if (d.id === 'scale') return (d.connected || d.paired) && weighings.length > 0;
    return d.connected || d.paired;
  });

  const getDevice = (id: string) => devices.find(d => d.id === id)!;

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

  const launchScan = async () => {
    setScanning(true);
    if (!pairingDevice) return;
    // Close the pairing popup and navigate to the real BLE connection page
    closePairing();
    setScanning(false);
    if (pairingDevice === 'bracelet') router.push('/(tabs)/devices' as any);
    else if (pairingDevice === 'vest') router.push('/vest-connect' as any);
    else if (pairingDevice === 'scale') { onStartWeighing?.(); }
  };

  /* ──── Glass overlay wrapper ──── */
  const GlassOverlay = ({ children, onClose }: { children: React.ReactNode; onClose: () => void }) => (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.4)', overflowY: 'auto', animation: 'glassIn 0.3s ease' } as any}>
      <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '70px 24px 120px', boxSizing: 'border-box' } as any}>
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
            >{isLast ? "Lancer l'appairage" : 'Suivant'}</div>
          </div>
        </div>
      </GlassOverlay>
    );
  };

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 } as any}>
      {connectedDevices.map((d, idx) => (
        <div key={d.id} data-testid={`device-card-${d.id}`} onClick={() => router.push('/(tabs)/devices' as any)} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderTop: idx > 0 ? '1px solid rgba(255,255,255,0.08)' : 'none', cursor: 'pointer' } as any}>
          <img src={d.img} alt="" style={{ width: 48, height: 48, objectFit: 'contain', flexShrink: 0 } as any} />
          <div style={{ flex: 1, minWidth: 0 } as any}>
            <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--card-text, #111)', marginBottom: 3 }}>{d.name}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 } as any}>
              <span style={{ width: 6, height: 6, borderRadius: 3, background: d.connected ? '#10B981' : d.id === 'vest' ? '#F59E0B' : '#EF4444' } as any} />
              <span style={{ fontSize: 10, fontWeight: 600, color: d.connected ? '#10B981' : d.id === 'vest' ? '#F59E0B' : '#EF4444' }}>{d.connected ? (d.id === 'vest' ? 'En marche' : 'Connecte') : (d.id === 'vest' ? 'En veille' : 'Deconnecte')}</span>
            </div>
            <div style={{ height: 4, borderRadius: 2, background: 'var(--card-sep, rgba(0,0,0,0.06))', overflow: 'hidden', marginTop: 6 } as any}><div style={{ height: 4, borderRadius: 2, width: `${d.battery}%`, background: batteryGrad(d.battery) } as any} /></div>
          </div>
          <div style={{ fontSize: 14, fontWeight: 900, color: batteryColor(d.battery), flexShrink: 0 }}>{d.battery}%</div>
          <i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: 'var(--card-arrow, rgba(0,0,0,0.2))', flexShrink: 0 }} />
        </div>
      ))}
      </div>

      {/* ──── Pairing Flow Popup ──── */}
      <PairingPopup />

      {/* ──── No Subscription Popup (bracelet) — single feature showcase ──── */}
      {showNoSubPopup && (
        <GlassOverlay onClose={() => setShowNoSubPopup(false)}>
          <div style={{ textAlign: 'center', marginBottom: 28 } as any}>
            <img src="https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/2fto1qw7_bracelet_sante_connecte_elio_chutex_care_teleassistance_telealarme%281%29.svg" alt="" style={{ width: 110, height: 110, objectFit: 'contain', margin: '0 auto 20px', display: 'block' } as any} />
            <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', marginBottom: 8, lineHeight: 1.2 }}>Bracelet Elio</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6 }}>Le bracelet connecte 4G qui veille sur votre sante au quotidien.</div>
          </div>

          {/* Features list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 } as any}>
            {[
              { icon: 'ri-heart-pulse-line', text: 'Suivi cardiaque continu (FC, HRV, SpO2)', color: '#EF4444' },
              { icon: 'ri-temp-hot-line', text: 'Temperature corporelle en temps reel', color: '#F59E0B' },
              { icon: 'ri-moon-line', text: 'Analyse du sommeil (phases, qualite, duree)', color: '#818CF8' },
              { icon: 'ri-footprint-line', text: 'Compteur de pas, calories et distance', color: '#10B981' },
              { icon: 'ri-alarm-warning-line', text: 'Detection automatique de chute', color: '#EF4444' },
              { icon: 'ri-signal-tower-line', text: 'Connectivite 4G integree', color: '#3B82F6' },
              { icon: 'ri-brain-line', text: 'Nora IA : analyse personnalisee de vos donnees', color: '#A78BFA' },
              { icon: 'ri-calendar-check-line', text: 'Programmes de prevention gratuits', color: '#22D3EE' },
              { icon: 'ri-body-scan-line', text: 'Estimation de l\'age biologique', color: '#F59E0B' },
            ].map((f, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' } as any}>
                <i className={f.icon} style={{ fontSize: 18, color: f.color, flexShrink: 0 }} />
                <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4 }}>{f.text}</span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <div data-testid="elio-cta-button" onClick={() => { setShowNoSubPopup(false); if (typeof window !== 'undefined') window.open('https://chutex-innovation.com/products/elio-smart-health-bracelet', '_blank'); }}
            style={{ padding: '17px', borderRadius: 999, background: '#FFF', cursor: 'pointer', textAlign: 'center', fontSize: 15, fontWeight: 800, color: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'transform 0.2s, opacity 0.2s' } as any}
            onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.opacity = '0.9'; }}
            onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; e.currentTarget.style.opacity = '1'; }}>
            <i className="ri-shopping-bag-line" style={{ fontSize: 18 }} />
            Decouvrir le Bracelet Elio
          </div>
        </GlassOverlay>
      )}
    </>
  );
}
