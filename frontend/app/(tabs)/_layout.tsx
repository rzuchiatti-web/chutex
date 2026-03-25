import React from 'react';
import { Tabs } from 'expo-router';
import { Icon, MCIcon } from '../../src/components/WebIcon';
import { useAuth } from '../../src/context/AuthContext';
import { Platform } from 'react-native';
import FullScreenLoader from '../../src/components/FullScreenLoader';
import GlassTabBar from '../../src/components/GlassTabBar';

export default function TabLayout() {
  const { user, loading } = useAuth();

  if (loading) return <FullScreenLoader />;
  if (!user) return null;

  const role = user.active_role || user.role;
  const isAdmin = role === 'admin';
  const isCompany = role === 'prescriber_company' || role === 'company';
  const isBen = role === 'beneficiary';
  const isG = role === 'guardian' || role === 'professional';
  const isWeb = Platform.OS === 'web';

  // GlassTabBar for web beneficiary & guardian (professional is now a guardian variant)
  const useGlass = isWeb && (isBen || isG);

  // Determine effective tab role for GlassTabBar config
  const tabRole = isG ? 'guardian' : isCompany ? 'company' : role === 'teleassistance' ? 'teleassistance' : 'beneficiary';

  // Hide default tab bar when using GlassTabBar or admin (has sidebar)
  const hideDefault = useGlass || isAdmin;
  const tabStyle = hideDefault
    ? { display: 'none' as const, height: 0, backgroundColor: 'transparent', borderTopWidth: 0, position: 'absolute' as const, overflow: 'hidden' as const }
    : isWeb
      ? { backgroundColor: 'transparent', borderTopWidth: 0, height: 64, paddingBottom: 0, elevation: 0, shadowColor: 'transparent', borderTopColor: 'transparent', position: 'absolute' as const, bottom: 0, left: 0, right: 0 }
      : { backgroundColor: 'transparent', borderTopWidth: 0, height: 70, paddingBottom: Math.max(12, 6), elevation: 0, shadowColor: 'transparent' };

  return (
    <Tabs
      key={role}
      tabBar={useGlass ? (props) => <GlassTabBar {...props} role={tabRole} /> : undefined}
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
        href: !isBen ? null : undefined,
      }} />
      <Tabs.Screen name="alerts" options={{
        tabBarIcon: ({ color, size }) => <Icon name={isAdmin ? 'warning-outline' : isCompany ? 'people-outline' : 'notifications-outline'} size={size} color={color} />,
        href: isBen ? null : undefined,
      }} />
      <Tabs.Screen name="teleconsult" options={{
        tabBarIcon: ({ color, size }) => (isAdmin || isCompany) ? <Icon name="medkit-outline" size={size} color={color} /> : isG ? <Icon name="tab-intervention" size={size} color={color} /> : <Icon name={role === 'teleassistance' ? 'headset-outline' : 'videocam-outline'} size={size} color={color} />,
      }} />
      <Tabs.Screen name="devices" options={{
        tabBarIcon: ({ color, size }) => (isCompany || isG) ? <Icon name="document-text-outline" size={size} color={color} /> : <MCIcon name="bluetooth-connect" size={size} color={color} />,
        href: (isWeb && isBen) ? null : undefined,
      }} />
      <Tabs.Screen name="profile" options={{
        tabBarIcon: ({ color, size }) => <Icon name="person-outline" size={size} color={color} />,
      }} />
    </Tabs>
  );
}
