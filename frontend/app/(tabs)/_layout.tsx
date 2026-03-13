import React from 'react';
import { Tabs } from 'expo-router';
import { Icon, MCIcon } from '../../src/components/WebIcon';
import { useAuth } from '../../src/context/AuthContext';
import { View, ActivityIndicator, Platform } from 'react-native';
import FullScreenLoader from '../../src/components/FullScreenLoader';

export default function TabLayout() {
  const { user, loading } = useAuth();
  const [isDark, setIsDark] = React.useState(true);

  React.useEffect(() => {
    if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
      const check = () => setIsDark(localStorage.getItem('chutex_dark') !== '0');
      check();
      const iv = setInterval(check, 500);
      return () => clearInterval(iv);
    }
  }, []);

  if (loading) return <FullScreenLoader />;
  if (!user) return null;

  const r = user.active_role || user.role;
  const isBen = r === 'beneficiary';
  const isG = r === 'guardian';
  const isTA = r === 'teleassistance';
  const isAdmin = r === 'admin';
  const isCompany = r === 'prescriber_company' || r === 'company';
  const isWebBen = Platform.OS === 'web' && isBen;

  // Single unified tab bar style — NO position absolute, just styled inline
  const isWebAny = Platform.OS === 'web' && (isBen || isG || isTA || isCompany);
  const hideTabBar = isAdmin;
  const tabStyle = hideTabBar ? {
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

  const activeColor = isDark ? '#FFFFFF' : '#111111';
  const inactiveColor = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)';

  const TabIcon = ({ icon, focused, svgIcon }: { icon?: string; focused: boolean; svgIcon?: any }) => {
    if (!isWebBen) return null;
    return (
      <div style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
        {svgIcon || <i className={icon} style={{ fontSize: 22, color: focused ? activeColor : inactiveColor }} />}
      </div>
    );
  };

  // Inject CSS to fix tab bar glass on web
  if ((isWebBen || (Platform.OS === 'web' && (isG || isTA))) && typeof document !== 'undefined') {
    const existing = document.getElementById('navbar-glass-fix');
    if (!existing) {
      const s = document.createElement('style');
      s.id = 'navbar-glass-fix';
      s.textContent = `[role="tablist"]{background:transparent!important;background-color:transparent!important;border-top:none!important;}[role="tablist"]>div{background:transparent!important;background-color:transparent!important;}`;
      document.head.appendChild(s);
    }
    // Force parent transparent via JS
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

  return (
    <Tabs key={`${r}-${isDark}`} sceneContainerStyle={{ backgroundColor: 'transparent' }} screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: activeColor,
      tabBarInactiveTintColor: inactiveColor,
      tabBarShowLabel: false,
      tabBarStyle: tabStyle,
    }}>
      <Tabs.Screen name="index" options={{
        tabBarIcon: ({ color, size, focused }) => isWebBen
          ? <TabIcon icon="ri-home-5-fill" focused={focused} />
          : <Icon name={(isAdmin || isCompany) ? 'stats-chart-outline' : 'home-outline'} size={size} color={color} />,
      }} />
      <Tabs.Screen name="health" options={{
        tabBarIcon: ({ color, size, focused }) => isWebBen
          ? <TabIcon icon="ri-heart-pulse-fill" focused={focused} />
          : isAdmin ? <Icon name="people-outline" size={size} color={color} /> : isCompany ? <Icon name="business-outline" size={size} color={color} /> : <MCIcon name="heart-pulse" size={size} color={color} />,
        href: (!isBen && !isAdmin && !isCompany) ? null : undefined,
      }} />
      <Tabs.Screen name="chat" options={{
        tabBarIcon: ({ color, size, focused }) => isWebBen
          ? <TabIcon icon="ri-dna-line" focused={focused} />
          : <Icon name="chatbubble-ellipses-outline" size={22} color={color} />,
        href: (!isBen) ? null : undefined,
      }} />
      <Tabs.Screen name="alerts" options={{
        tabBarIcon: ({ color, size }) => <Icon name={isAdmin ? 'warning-outline' : isCompany ? 'people-outline' : 'notifications-outline'} size={size} color={color} />,
        href: isBen ? null : undefined,
      }} />
      <Tabs.Screen name="teleconsult" options={{
        tabBarIcon: ({ color, size, focused }) => isWebBen
          ? <TabIcon icon="ri-stethoscope-fill" focused={focused} />
          : (isAdmin || isCompany) ? <Icon name="medkit-outline" size={size} color={color} /> : isG ? <Icon name="tab-intervention" size={size} color={color} /> : <Icon name={isTA ? 'headset-outline' : 'videocam-outline'} size={size} color={color} />,
        href: isBen ? null : undefined,
      }} />
      <Tabs.Screen name="devices" options={{
        tabBarIcon: ({ color, size, focused }) => isWebBen
          ? <TabIcon icon="ri-bluetooth-connect-fill" focused={focused} />
          : isCompany ? <Icon name="document-text-outline" size={size} color={color} /> : isG ? <Icon name="document-text-outline" size={size} color={color} /> : <MCIcon name="bluetooth-connect" size={size} color={color} />,
      }} />
      <Tabs.Screen name="profile" options={{
        tabBarIcon: ({ color, size, focused }) => isWebBen
          ? <TabIcon icon="ri-user-fill" focused={focused} />
          : <Icon name="person-outline" size={size} color={color} />,
      }} />
    </Tabs>
  );
}
