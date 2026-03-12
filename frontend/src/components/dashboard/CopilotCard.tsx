import React from 'react';
import { useRouter } from 'expo-router';
import { useI18n } from '../../context/I18nContext';

const NORA_VIDEO = 'https://customer-assets.emergentagent.com/job_ba3a5789-c8f1-4b12-b5d8-478a7f99aaea/artifacts/b6eh1r76_Nora_video.mp4';

export default function CopilotCard({ subtitle }: { subtitle?: string }) {
  const router = useRouter();
  const { t } = useI18n();
  return (
    <div data-testid="copilot-ia-card" onClick={() => router.push('/chat-ia' as any)}
      className="dash-slide-up"
      style={{ borderRadius: 20, overflow: 'hidden', position: 'relative', height: 110, marginBottom: 12, cursor: 'pointer', transition: 'transform 0.18s', background: '#000', display: 'flex', alignItems: 'center' } as any}
      onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-2px) scale(1.005)'; }}
      onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
      {/* Nora Video — right side, with vertical padding */}
      <div style={{ position: 'absolute', right: 0, top: 8, bottom: 8, width: 130, overflow: 'hidden', borderRadius: 12 } as any}>
        <video src={NORA_VIDEO} autoPlay loop muted playsInline
          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 } as any} />
      </div>
      <div style={{ position: 'absolute', right: 100, top: 0, height: '100%', width: 60, background: 'linear-gradient(90deg, #000 0%, transparent 100%)', zIndex: 1 } as any} />
      {/* Text — left side */}
      <div style={{ position: 'relative', zIndex: 2, padding: '0 22px', maxWidth: '60%' } as any}>
        <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF', marginBottom: 6, letterSpacing: -0.3, lineHeight: 1.15 }}>Nora IA</div>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.5 }}>{subtitle || t('nora_subtitle')}</div>
      </div>
      <i className="ri-arrow-right-s-line" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 20, color: 'rgba(255,255,255,0.3)', zIndex: 3 }} />
    </div>
  );
}
