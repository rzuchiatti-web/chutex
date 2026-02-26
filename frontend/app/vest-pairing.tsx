import React, { useState } from 'react';
import { View, Text, Platform } from 'react-native';
import { useRouter } from 'expo-router';

const VEST_IMG = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/ljh1zzu3_Gilet_Elder_airbag_Chutex.svg';
const BG = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/j2b92wwx_ChatGPT%20Image%2017%20f%C3%A9vr.%202025%2C%2015_59_23.png';

const STEPS = [
  {
    icon: 'ri-shirt-line',
    title: 'Enfilez le gilet',
    desc: 'Enfilez le gilet Elder par-dessus vos vetements. Assurez-vous que la fermeture eclair est bien en face avant.',
    tip: 'Le gilet doit etre porte pres du corps pour une detection optimale des chutes.',
  },
  {
    icon: 'ri-ruler-line',
    title: 'Ajustez les sangles',
    desc: 'Serrez les sangles laterales pour que le gilet soit bien ajuste a votre taille. Il ne doit pas etre trop lache.',
    tip: 'Un ajustement correct est essentiel pour le bon fonctionnement des airbags.',
  },
  {
    icon: 'ri-power-line',
    title: 'Activez le gilet',
    desc: 'Appuyez sur le bouton d\'alimentation situe a l\'interieur pres du col. Un bip sonore confirme l\'activation.',
    tip: 'Le voyant vert fixe signifie que le gilet est pret. Un voyant rouge signifie que la batterie est faible.',
  },
  {
    icon: 'ri-bluetooth-connect-line',
    title: 'Recherche en cours...',
    desc: 'Rapprochez votre telephone du gilet. L\'appairage Bluetooth va demarrer automatiquement.',
    tip: 'Le gilet est detecte sous le nom "Elder-XXXX" dans la liste Bluetooth.',
  },
];

export default function VestPairingScreen() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  if (Platform.OS !== 'web') {
    return <View style={{ flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: '#FFF' }}>Appairage Gilet</Text></View>;
  }

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const goToScan = () => {
    router.replace('/vest-connect' as any);
  };

  return (
    <div data-testid="vest-pairing" style={{ position: 'fixed', inset: 0, zIndex: 99999, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif", background: '#040E1A' } as any}>
      <img src={BG} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.3, zIndex: 0 } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(4,14,26,0.3) 0%, rgba(4,14,26,0.95) 100%)', zIndex: 1 } as any} />

      <div style={{ flex: 1, position: 'relative', zIndex: 5, overflowY: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 24px 120px', maxWidth: 420, margin: '0 auto', width: '100%', boxSizing: 'border-box' } as any}>

        {/* Close button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', width: '100%', marginBottom: 20 } as any}>
          <div data-testid="close-pairing" onClick={() => router.back()} style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
            <i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)' }} />
          </div>
        </div>

        {/* Device image */}
        <div style={{ marginBottom: 28 } as any}>
          <img src={VEST_IMG} alt="Gilet Elder" style={{ width: 120, height: 120, objectFit: 'contain', filter: 'drop-shadow(0 8px 32px rgba(16,185,129,0.2))' } as any} />
        </div>

        {/* Step indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 } as any}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ height: 4, borderRadius: 2, width: i === step ? 24 : 12, background: i === step ? '#10B981' : i < step ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.1)', transition: 'all 0.3s' } as any} />
          ))}
        </div>

        {/* Step content */}
        <div style={{ textAlign: 'center', marginBottom: 32, animation: 'fadeIn 0.4s ease' } as any}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' } as any}>
            <i className={current.icon} style={{ fontSize: 26, color: '#10B981' }} />
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(16,185,129,0.5)', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>Etape {step + 1}/{STEPS.length}</div>
          <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF', marginBottom: 12, lineHeight: 1.3 }}>{current.title}</div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, maxWidth: 320, margin: '0 auto' }}>{current.desc}</div>
        </div>

        {/* Tip */}
        <div style={{ padding: '14px 18px', borderRadius: 16, background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)', marginBottom: 32, width: '100%' } as any}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 } as any}>
            <i className="ri-information-line" style={{ fontSize: 16, color: '#10B981', flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>{current.tip}</span>
          </div>
        </div>

        {/* Navigation buttons */}
        <div style={{ display: 'flex', gap: 10, width: '100%' } as any}>
          {step > 0 && (
            <div data-testid="pairing-prev" onClick={() => setStep(step - 1)} style={{ flex: 1, padding: '16px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', textAlign: 'center', fontSize: 14, fontWeight: 700, color: 'rgba(255,255,255,0.5)', transition: 'background 0.2s' } as any}
              onMouseEnter={(e: any) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
              onMouseLeave={(e: any) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
            >Retour</div>
          )}
          <div data-testid="pairing-next" onClick={() => isLast ? goToScan() : setStep(step + 1)} style={{ flex: 1, padding: '16px', borderRadius: 999, background: isLast ? 'linear-gradient(135deg, #059669, #10B981)' : '#FFF', cursor: 'pointer', textAlign: 'center', fontSize: 14, fontWeight: 700, color: isLast ? '#FFF' : '#111', boxShadow: isLast ? '0 4px 20px rgba(16,185,129,0.3)' : 'none', transition: 'transform 0.2s' } as any}
            onMouseEnter={(e: any) => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={(e: any) => e.currentTarget.style.transform = ''}
          >{isLast ? 'Lancer le scan' : 'Suivant'}</div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: '@keyframes fadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}' }} />
    </div>
  );
}
