import React from 'react';
import { useRouter } from 'expo-router';

export default function CopilotCard() {
  const router = useRouter();
  return (
    <div data-testid="copilot-ia-card" onClick={() => router.push('/chat-ia' as any)} style={{ borderRadius: 22, overflow: 'hidden', position: 'relative', height: 160, marginBottom: 16, cursor: 'pointer', transition: 'transform 0.2s' } as any} onMouseEnter={(e: any) => e.currentTarget.style.transform='translateY(-2px)'} onMouseLeave={(e: any) => e.currentTarget.style.transform=''}>
      <video autoPlay loop muted playsInline style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} src="https://customer-assets.emergentagent.com/job_9950a869-9328-4a4b-abf4-a6fb213a3b47/artifacts/akdwga2r_background_card_ia.mp4" />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(0,0,0,0.4), rgba(0,0,0,0.15))', zIndex: 1 } as any} />
      <div style={{ position: 'relative', zIndex: 2, padding: '22px 20px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' } as any}>
        <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', marginBottom: 6, letterSpacing: -0.3, lineHeight: 1.1 }}>Nora IA</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5, maxWidth: 220 }}>Votre assistante medicale personnelle, a votre ecoute 24h/24.</div>
      </div>
    </div>
  );
}
