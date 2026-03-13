import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Icon, MCIcon } from '../../src/components/WebIcon';
import { useAuth } from '../../src/context/AuthContext';
import { View, ActivityIndicator, Platform } from 'react-native';
import FullScreenLoader from '../../src/components/FullScreenLoader';

const NORA_VIDEO = 'https://customer-assets.emergentagent.com/job_ba3a5789-c8f1-4b12-b5d8-478a7f99aaea/artifacts/b6eh1r76_Nora_video.mp4';

/* ── Custom Whoop-style tab bar for web beneficiary & guardian ── */
function WhoopTabBar({ state, navigation, role }: any) {
  const router = useRouter();
  const [isDark, setIsDark] = React.useState(true);

  React.useEffect(() => {
    if (typeof localStorage !== 'undefined') {
      const check = () => setIsDark(localStorage.getItem('chutex_dark') !== '0');
      check();
      const iv = setInterval(check, 500);
      return () => clearInterval(iv);
    }
  }, []);

  const activeColor = isDark ? '#FFF' : '#111';
  const inactiveColor = isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.25)';
  const glassBg = isDark ? 'rgba(10,10,18,0.35)' : 'rgba(245,245,250,0.4)';

  const tabs = role === 'guardian' ? [
    { key: 'index', icon: 'ri-home-smile-2-fill', label: 'Accueil' },
    { key: 'teleconsult', icon: 'ri-service-fill', label: 'Interventions' },
    { key: 'devices', icon: 'ri-file-list-3-fill', label: 'Prescriptions' },
    { key: 'profile', icon: 'ri-menu-3-fill', label: 'Plus' },
  ] : [
    { key: 'index', icon: 'ri-home-smile-2-fill', label: 'Accueil' },
    { key: 'health', icon: 'ri-heart-pulse-fill', label: 'Sante' },
    { key: 'chat', icon: 'ri-dna-fill', label: 'Programmes' },
    { key: 'profile', icon: 'ri-menu-3-fill', label: 'Plus' },
  ];

  const currentRoute = state?.routes?.[state.index]?.name || '';

  return (
    <div style={{ position: 'fixed', bottom: 16, left: 16, right: 16, zIndex: 999, display: 'flex', alignItems: 'center', gap: 12, pointerEvents: 'auto' } as any}>
      {/* Glass tab container */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-around',
        height: 62, borderRadius: 22, padding: '0 8px',
        background: glassBg,
        backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
        border: isDark ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
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
              <span style={{ fontSize: 9, fontWeight: 700, color: isActive ? activeColor : inactiveColor, letterSpacing: 0.3, transition: 'color 0.2s' }}>{tab.label}</span>
            </div>
          );
        })}
      </div>

      {/* Nora AI circle button */}
      <div data-testid="nav-nora-button"
        onClick={() => router.push('/chat-ia' as any)}
        style={{
          width: 62, height: 62, borderRadius: 999, flexShrink: 0,
          background: '#000', overflow: 'hidden', cursor: 'pointer',
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'transform 0.2s, box-shadow 0.2s',
          position: 'relative',
        } as any}
        onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'scale(1.08)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.4)'; }}
        onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)'; }}>
        <video autoPlay loop muted playsInline style={{ width: '70%', height: '70%', objectFit: 'cover', borderRadius: 999 } as any} src={NORA_VIDEO} />
      </div>
    </div>
  );
}

export default function TabLayout() {
  const { user, loading } = useAuth();

  if (loading) return <FullScreenLoader />;
  if (!user) return null;

  const r = user.active_role || user.role;
  const isBen = r === 'beneficiary';
  const isG = r === 'guardian';
  const isTA = r === 'teleassistance';
  const isAdmin = r === 'admin';
  const isCompany = r === 'prescriber_company' || r === 'company';
  const isWebBen = Platform.OS === 'web' && isBen;
  const isWebG = Platform.OS === 'web' && isG;
  const useWhoop = isWebBen || isWebG;

  const isWebAny = Platform.OS === 'web' && (isBen || isG || isTA || isCompany);
  const hideTabBar = isAdmin;

  // Non-web or non-beneficiary tab bar style
  const tabStyle = hideTabBar ? {
    display: 'none' as any,
    height: 0,
  } : useWhoop ? {
    display: 'none' as any,
    height: 0,
  } : isWebAny ? {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    height: 64,
    paddingBottom: 0,
    paddingHorizontal: 16,
    elevation: 0,
    shadowColor: 'transparent',
    borderTopColor: 'transparent',
    position: 'absolute' as any,
    bottom: 0,
    left: 0,
    right: 0,
  } : {
    backgroundColor: 'transparent',
    borderTopWidth: 0,
    height: 70,
    paddingBottom: Math.max(12, 6),
    elevation: 0,
    shadowColor: 'transparent',
  };

  // Inject CSS to fix tab bar glass on web (for non-whoop roles)
  if (!useWhoop && (Platform.OS === 'web' && (isG || isTA))) {
    if (typeof document !== 'undefined') {
      const existing = document.getElementById('navbar-glass-fix');
      if (!existing) {
        const s = document.createElement('style');
        s.id = 'navbar-glass-fix';
        s.textContent = `[role="tablist"]{background:transparent!important;background-color:transparent!important;border-top:none!important;}[role="tablist"]>div{background:transparent!important;background-color:transparent!important;}`;
        document.head.appendChild(s);
      }
      requestAnimationFrame(() => {
        const tl = document.querySelector('[role="tablist"]');
        if (tl) {
          let p = tl.parentElement;
          while (p && p !== document.body) {
            (p as HTMLElement).style.backgroundColor = 'transparent';
            (p as HTMLElement).style.background = 'transparent';
            p = p.parentElement;
          }
        }
      });
    }
  }

  return (
    <Tabs
      key={r}
      tabBar={useWhoop ? (props) => <WhoopTabBar {...props} role={isG ? 'guardian' : 'beneficiary'} /> : undefined}
      sceneContainerStyle={{ backgroundColor: 'transparent' }}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.35)',
        tabBarShowLabel: false,
        tabBarStyle: tabStyle,
      }}>
      <Tabs.Screen name="index" options={{
        tabBarIcon: ({ color, size }) => <Icon name={(isAdmin || isCompany) ? 'stats-chart-outline' : 'home-outline'} size={size} color={color} />,
      }} />
      <Tabs.Screen name="health" options={{
        tabBarIcon: ({ color, size }) => isAdmin ? <Icon name="people-outline" size={size} color={color} /> : isCompany ? <Icon name="business-outline" size={size} color={color} /> : <MCIcon name="heart-pulse" size={size} color={color} />,
        href: (!isBen && !isG && !isAdmin && !isCompany) ? null : undefined,
      }} />
      <Tabs.Screen name="chat" options={{
        tabBarIcon: ({ color, size }) => <Icon name="chatbubble-ellipses-outline" size={22} color={color} />,
        href: (!isBen) ? null : undefined,
      }} />
      <Tabs.Screen name="alerts" options={{
        tabBarIcon: ({ color, size }) => <Icon name={isAdmin ? 'warning-outline' : isCompany ? 'people-outline' : 'notifications-outline'} size={size} color={color} />,
        href: isBen ? null : undefined,
      }} />
      <Tabs.Screen name="teleconsult" options={{
        tabBarIcon: ({ color, size }) => (isAdmin || isCompany) ? <Icon name="medkit-outline" size={size} color={color} /> : isG ? <Icon name="tab-intervention" size={size} color={color} /> : <Icon name={isTA ? 'headset-outline' : 'videocam-outline'} size={size} color={color} />,
        href: isWebBen ? null : undefined,
      }} />
      <Tabs.Screen name="devices" options={{
        tabBarIcon: ({ color, size }) => isCompany ? <Icon name="document-text-outline" size={size} color={color} /> : isG ? <Icon name="document-text-outline" size={size} color={color} /> : <MCIcon name="bluetooth-connect" size={size} color={color} />,
        href: isWebBen ? null : undefined,
      }} />
      <Tabs.Screen name="profile" options={{
        tabBarIcon: ({ color, size }) => <Icon name="person-outline" size={size} color={color} />,
      }} />
    </Tabs>
  );
}
