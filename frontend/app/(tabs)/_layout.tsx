import React from 'react';
import { Tabs } from 'expo-router';
import { Icon, MCIcon } from '../../src/components/WebIcon';
import { useAuth } from '../../src/context/AuthContext';
import { View, ActivityIndicator, Platform } from 'react-native';
import FullScreenLoader from '../../src/components/FullScreenLoader';

const DnaIcon = ({ size = 22, color = '#FFF' }: { size?: number; color?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={color} width={size} height={size}><path d="M18 1C18 1.71561 17.9359 2.37948 17.8155 3H8.23193C8.41382 3.72694 8.69997 4.38283 9.08066 5H17.1807C16.132 7.31672 14.1871 8.99371 12 10.7267C8.72906 8.13494 6 5.66845 6 1H4C4 6.46624 7.21013 9.46355 10.3863 12C7.21013 14.5365 4 17.5338 4 23H6C6 18.0404 9.08011 15.566 12.6178 12.7863L12.7096 12.7142C16.149 10.0123 20 6.98705 20 1H18ZM17.8155 21.0002H8.23193C8.41382 20.2733 8.69997 19.6174 9.08066 19.0002H17.1807C16.3939 17.262 15.1026 15.8839 13.583 14.5721C14.1162 14.1516 14.6526 13.7351 15.1811 13.3086C17.7659 15.5981 20 18.44 20 23.0002H18C18 22.2846 17.9359 21.6207 17.8155 21.0002Z" /></svg>
);

const StethIcon = ({ size = 22, color = '#FFF' }: { size?: number; color?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={color} width={size} height={size}><path d="M8 3V5H6V9C6 11.2091 7.79086 13 10 13C12.2091 13 14 11.2091 14 9V5H12V3H15V9C15 11.4926 13.2822 13.5514 11 13.9146V15C11 17.7614 13.2386 20 16 20C17.8638 20 19.4299 18.973 20.1853 17.4709C19.4856 17.1622 19 16.3875 19 15.5C19 14.3954 19.8954 13.5 21 13.5C22.1046 13.5 23 14.3954 23 15.5C23 16.3875 22.5144 17.1622 21.8147 17.4709C20.9458 19.7766 18.6807 21.5 16 21.5C12.4101 21.5 9.5 18.5899 9.5 15V13.9146C7.21776 13.5514 5.5 11.4926 5.5 9V3H8Z" /></svg>
);

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

  const TabIcon = ({ icon, focused, svgIcon }: { icon?: string; focused: boolean; svgIcon?: any }) => {
    if (!isWebBen) return null;
    return (
      <div style={{ width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
        {svgIcon || <i className={icon} style={{ fontSize: 22, color: focused ? '#FFF' : 'rgba(255,255,255,0.35)' }} />}
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
    <Tabs key={r} sceneContainerStyle={{ backgroundColor: 'transparent' }} screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#FFFFFF',
      tabBarInactiveTintColor: 'rgba(255,255,255,0.35)',
      tabBarShowLabel: false,
      tabBarStyle: tabStyle,
    }}>
      <Tabs.Screen name="index" options={{
        tabBarIcon: ({ color, size, focused }) => isWebBen
          ? <TabIcon icon="ri-home-5-line" focused={focused} />
          : <Icon name={(isAdmin || isCompany) ? 'stats-chart-outline' : 'home-outline'} size={size} color={color} />,
      }} />
      <Tabs.Screen name="health" options={{
        tabBarIcon: ({ color, size, focused }) => isWebBen
          ? <TabIcon icon="ri-heart-pulse-line" focused={focused} />
          : isAdmin ? <Icon name="people-outline" size={size} color={color} /> : isCompany ? <Icon name="business-outline" size={size} color={color} /> : <MCIcon name="heart-pulse" size={size} color={color} />,
        href: (!isBen && !isAdmin && !isCompany) ? null : undefined,
      }} />
      <Tabs.Screen name="chat" options={{
        tabBarIcon: ({ color, size, focused }) => isWebBen
          ? <TabIcon focused={focused} svgIcon={<DnaIcon size={22} color={focused ? '#FFF' : 'rgba(255,255,255,0.35)'} />} />
          : <Icon name="chatbubble-ellipses-outline" size={22} color={color} />,
        href: (!isBen) ? null : undefined,
      }} />
      <Tabs.Screen name="alerts" options={{
        tabBarIcon: ({ color, size }) => <Icon name={isAdmin ? 'warning-outline' : isCompany ? 'people-outline' : 'notifications-outline'} size={size} color={color} />,
        href: isBen ? null : undefined,
      }} />
      <Tabs.Screen name="teleconsult" options={{
        tabBarIcon: ({ color, size, focused }) => isWebBen
          ? <TabIcon focused={focused} svgIcon={<StethIcon size={22} color={focused ? '#FFF' : 'rgba(255,255,255,0.35)'} />} />
          : (isAdmin || isCompany) ? <Icon name="medkit-outline" size={size} color={color} /> : isG ? <Icon name="tab-intervention" size={size} color={color} /> : <Icon name={isTA ? 'headset-outline' : 'videocam-outline'} size={size} color={color} />,
      }} />
      <Tabs.Screen name="devices" options={{
        tabBarIcon: ({ color, size }) => isCompany ? <Icon name="document-text-outline" size={size} color={color} /> : <MCIcon name="bluetooth-connect" size={size} color={color} />,
        href: isBen ? null : undefined,
      }} />
      <Tabs.Screen name="profile" options={{
        tabBarIcon: ({ color, size, focused }) => isWebBen
          ? <TabIcon icon="ri-user-line" focused={focused} />
          : <Icon name="person-outline" size={size} color={color} />,
      }} />
    </Tabs>
  );
}
