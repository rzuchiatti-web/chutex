import React from 'react';
import { useRouter } from 'expo-router';
import { useI18n } from '../../../context/I18nContext';

const IMG_GUARDIANS = 'https://customer-assets.emergentagent.com/job_ba3a5789-c8f1-4b12-b5d8-478a7f99aaea/artifacts/ashlkedd_img_gardians.png';

export function GuardiansSection({ guardians, C, glass, isDark, setShowAddGuardianPopup }: any) {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <div data-testid="guardians-section" className="dash-slide-up" style={{ marginBottom: 28 } as any}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 } as any}>
        <div style={{ fontSize: 20, fontWeight: 900, color: C.text, letterSpacing: '-0.3px' } as any}>Mes gardiens</div>
        <img src={IMG_GUARDIANS} alt="" style={{ width: 90, height: 45, objectFit: 'contain' } as any} />
      </div>
      <div style={{ fontSize: 13, color: C.sub, marginBottom: 16, lineHeight: '1.45' } as any}>Retrouvez l'ensemble de vos gardiens qui veillent sur vous au quotidien.</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 } as any}>
        {guardians.map((g: any, i: number) => (
          <div key={g.id || i} onClick={() => router.push({ pathname: '/guardian-detail', params: { guardianId: g.id } })}
            style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 18, background: C.card, cursor: 'pointer', transition: 'transform 0.15s', ...glass } as any}
            onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; }}>
            <div style={{ width: 50, height: 50, borderRadius: 999, background: g.avatar_url ? 'transparent' : '#3A3A42', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', flexShrink: 0 } as any}>
              {g.avatar_url ? <img src={g.avatar_url} style={{ width: 50, height: 50, borderRadius: 999, objectFit: 'cover' } as any} /> : <span style={{ fontSize: 20, fontWeight: 800, color: '#FFF' }}>{g.name?.charAt(0)}</span>}
            </div>
            <div style={{ flex: 1 } as any}>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{g.name}</div>
              <div style={{ fontSize: 12, color: C.sub, marginTop: 2 }}>{g.relationship || t('guardian')}</div>
            </div>
            <i className="ri-arrow-right-s-line" style={{ fontSize: 20, color: C.arrow }} />
          </div>
        ))}
        {guardians.length === 0 && <div style={{ padding: '20px', borderRadius: 18, background: C.card, textAlign: 'center', ...glass } as any}><div style={{ fontSize: 13, color: C.sub }}>Aucun gardien pour le moment</div></div>}
      </div>
      <div data-testid="add-guardian-btn" onClick={() => setShowAddGuardianPopup(true)} style={{ marginTop: 14, padding: '15px', borderRadius: 999, background: isDark ? '#FFF' : '#111', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'opacity 0.15s' } as any}
        onMouseEnter={(e: any) => { e.currentTarget.style.opacity = '0.85'; }}
        onMouseLeave={(e: any) => { e.currentTarget.style.opacity = '1'; }}>
        <i className="ri-heart-add-line" style={{ fontSize: 18, color: isDark ? '#111' : '#FFF' }} />
        <span style={{ fontSize: 14, fontWeight: 700, color: isDark ? '#111' : '#FFF' }}>Ajouter un gardien</span>
      </div>
    </div>
  );
}
