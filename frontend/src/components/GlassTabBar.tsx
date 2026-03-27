import React from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../context/AuthContext';

const NORA_VIDEO = 'https://customer-assets.emergentagent.com/job_ba3a5789-c8f1-4b12-b5d8-478a7f99aaea/artifacts/b6eh1r76_Nora_video.mp4';

export interface TabConfig {
  key: string;
  icon: string;
  label: string;
}

function getGuardianTabs(user: any): TabConfig[] {
  const tabs: TabConfig[] = [
    { key: 'index', icon: 'ri-home-smile-2-fill', label: 'Accueil' },
    { key: 'health', icon: 'ri-run-fill', label: 'Activite' },
  ];
  const hasSaad = !!user?.saad_company_id;
  const proType = user?.professional_type;
  const isCoachOrPhysio = proType === 'coach' || proType === 'physio';

  if (hasSaad) {
    tabs.push({ key: 'teleconsult', icon: 'ri-service-fill', label: 'Care' });
  }
  if (hasSaad || isCoachOrPhysio) {
    tabs.push({ key: 'devices', icon: 'ri-file-list-3-fill', label: 'Prescriptions' });
  }
  if (isCoachOrPhysio) {
    tabs.push({ key: 'alerts', icon: 'ri-chat-3-fill', label: 'Messages' });
  }
  tabs.push({ key: 'profile', icon: 'ri-menu-3-fill', label: 'Plus' });
  return tabs;
}

export const TAB_CONFIGS: Record<string, TabConfig[]> = {
  beneficiary: [
    { key: 'index', icon: 'ri-home-smile-2-fill', label: 'Accueil' },
    { key: 'health', icon: 'ri-heart-pulse-fill', label: 'Sante' },
    { key: 'chat', icon: 'ri-dna-fill', label: 'Programmes' },
    { key: 'profile', icon: 'ri-menu-3-fill', label: 'Plus' },
  ],
  teleassistance: [
    { key: 'index', icon: 'ri-dashboard-3-fill', label: 'Dashboard' },
    { key: 'alerts', icon: 'ri-alarm-warning-fill', label: 'Alertes' },
    { key: 'teleconsult', icon: 'ri-headphone-fill', label: 'Appels' },
    { key: 'profile', icon: 'ri-menu-3-fill', label: 'Plus' },
  ],
  company: [
    { key: 'index', icon: 'ri-bar-chart-box-fill', label: 'Stats' },
    { key: 'health', icon: 'ri-building-2-fill', label: 'Agence' },
    { key: 'alerts', icon: 'ri-group-fill', label: 'Equipes' },
    { key: 'profile', icon: 'ri-menu-3-fill', label: 'Plus' },
  ],
};

interface GlassTabBarProps {
  state: any;
  navigation: any;
  role: string;
  showNora?: boolean;
}

export default function GlassTabBar({ state, navigation, role, showNora = true }: GlassTabBarProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isDark, setIsDark] = React.useState(false);

  React.useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      const check = () => setIsDark(localStorage.getItem('chutex_dark') === '1');
      check();
      const iv = setInterval(check, 500);
      return () => clearInterval(iv);
    }
  }, []);

  const isGuardian = role === 'guardian' || role === 'professional';
  const tabs = isGuardian ? getGuardianTabs(user) : (TAB_CONFIGS[role] || TAB_CONFIGS.beneficiary);
  const currentRoute = state?.routes?.[state.index]?.name || '';

  React.useEffect(() => {
    if (typeof document !== 'undefined') {
      const stale = document.getElementById('teleconsult-dark-nav');
      if (stale) stale.remove();
    }
  }, [currentRoute]);

  const guardianSubPages = ['teleconsult', 'devices'];
  const forceNavDark = guardianSubPages.includes(currentRoute);
  const navDark = forceNavDark || isDark;

  const activeColor = navDark ? '#FFF' : '#111';
  const inactiveColor = navDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)';
  const glassBg = navDark ? 'rgba(10,10,18,0.35)' : 'rgba(245,245,250,0.4)';
  const borderColor = navDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)';

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `body.nora-active .glass-tab-bar-root{display:none!important}` }} />
      <div className="glass-tab-bar-root" style={{ position: 'fixed', bottom: 16, left: 16, right: 16, zIndex: 999, display: 'flex', alignItems: 'center', gap: 12, pointerEvents: 'auto' } as any}>
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        height: 62, borderRadius: 22, padding: '0 8px',
        background: glassBg,
        backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
        border: `1px solid ${borderColor}`,
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        transform: 'translateZ(0)',
        willChange: 'backdrop-filter',
        WebkitTransform: 'translateZ(0)',
      } as any}>
        {tabs.map((tab) => {
          const isActive = currentRoute === tab.key;
          return (
            <div key={tab.key} data-testid={`nav-tab-${tab.key}`}
              onClick={() => {
                const idx = state.routes.findIndex((r: any) => r.name === tab.key);
                if (idx >= 0) navigation.navigate(state.routes[idx].name);
              }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, padding: '8px 12px', cursor: 'pointer', transition: 'opacity 0.2s', opacity: isActive ? 1 : 0.6 } as any}>
              <i className={tab.icon} style={{ fontSize: 22, color: isActive ? activeColor : inactiveColor, transition: 'color 0.2s' }} />
              <span style={{ fontSize: 9, fontWeight: 700, color: isActive ? activeColor : inactiveColor, letterSpacing: 0.3, transition: 'color 0.2s', display: 'none' }}>{tab.label}</span>
            </div>
          );
        })}
      </div>

      {showNora && (
        <div data-testid="nav-nora-button"
          onClick={() => router.push('/chat-ia' as any)}
          style={{
            width: 62, height: 62, borderRadius: 999, flexShrink: 0,
            background: '#000', overflow: 'hidden', cursor: 'pointer',
            border: '1px solid rgba(255,255,255,0.15)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'transform 0.2s, box-shadow 0.2s',
          } as any}
          onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)'; }}
          onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)'; }}>
          <video autoPlay loop muted playsInline style={{ width: '70%', height: '70%', objectFit: 'cover', borderRadius: 999 } as any} src={NORA_VIDEO} />
        </div>
      )}
    </div>
    </>
  );
}
