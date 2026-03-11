import React from 'react';
import { useRouter } from 'expo-router';
import { useI18n } from '../../context/I18nContext';

const AI_SPHERE = 'https://static.prod-images.emergentagent.com/jobs/76eff36f-ffaa-490a-9cab-d072884ad530/images/6f5c0a5fcf904bfe8d27d851a098264ced95c7777eafb6ee5481750054597832.png';

export default function CopilotCard({ subtitle }: { subtitle?: string }) {
  const router = useRouter();
  const { t } = useI18n();
  return (
    <div data-testid="copilot-ia-card" onClick={() => router.push('/chat-ia' as any)}
      style={{ borderRadius: 20, overflow: 'hidden', position: 'relative', height: 140, marginBottom: 12, cursor: 'pointer', transition: 'transform 0.15s, background 0.15s', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center' } as any}
      onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = 'rgba(255,255,255,0.10)'; }}
      onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}>
      {/* AI Sphere — right side */}
      <img src={AI_SPHERE} alt="" style={{ position: 'absolute', right: -10, top: '50%', transform: 'translateY(-50%)', width: 150, height: 150, objectFit: 'contain', opacity: 0.85, zIndex: 0 } as any} />
      {/* Text — left side */}
      <div style={{ position: 'relative', zIndex: 2, padding: '0 24px', maxWidth: '60%' } as any}>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', marginBottom: 6, letterSpacing: -0.3, lineHeight: 1.1 }}>Nora IA</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>{subtitle || t('nora_subtitle')}</div>
      </div>
    </div>
  );
}
