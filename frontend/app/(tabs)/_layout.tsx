import React from 'react';
import { Tabs } from 'expo-router';
import { Icon, MCIcon } from '../../src/components/WebIcon';
import { useAuth } from '../../src/context/AuthContext';
import { View, ActivityIndicator, Platform } from 'react-native';

export default function TabLayout() {
  const { user, loading } = useAuth();

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0b0f16' }}><ActivityIndicator size="large" color="#FFF" /></View>;
  if (!user) return null;

  const r = user.active_role || user.role;
  const isBen = r === 'beneficiary';
  const isG = r === 'guardian';
  const isTA = r === 'teleassistance';
  const isAdmin = r === 'admin';
  const isCompany = r === 'prescriber_company';
  const isWebBen = Platform.OS === 'web' && isBen;

  // Active pill: dark circle with white icon
  const ActivePill = ({ children }: any) => (
    <div style={{ width: 46, height: 46, borderRadius: '50%', background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 18px rgba(2,6,23,0.22), inset 0 1px 0 rgba(255,255,255,0.88)', border: '1px solid rgba(255,255,255,0.95)' } as any}>{children}</div>
  );

  return (
    <Tabs key={r} sceneContainerStyle={{ backgroundColor: 'transparent' }} screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: isWebBen ? '#111827' : '#FFFFFF',
      tabBarInactiveTintColor: isWebBen ? 'rgba(15,23,42,0.40)' : 'rgba(255,255,255,0.45)',
      tabBarShowLabel: false,
      tabBarStyle: isWebBen ? {
        position: 'absolute' as any,
        bottom: 14,
        left: '50%' as any,
        transform: [{ translateX: -185 }],
        width: 370,
        height: 62,
        borderRadius: 999,
        borderTopWidth: 0,
        elevation: 0,
        shadowColor: 'transparent',
        backgroundColor: 'rgba(255,255,255,0.82)',
        borderWidth: 1,
        borderColor: 'rgba(15,23,42,0.10)',
        paddingHorizontal: 6,
        paddingBottom: 0,
        ...(Platform.OS === 'web' ? {
          backdropFilter: 'blur(18px) saturate(150%)',
          WebkitBackdropFilter: 'blur(18px) saturate(150%)',
          boxShadow: '0 16px 26px rgba(15,23,42,0.14), inset 0 1px 0 rgba(255,255,255,0.94)',
        } as any : {}),
      } : {
        backgroundColor: 'transparent',
        borderTopWidth: 0,
        height: Platform.OS === 'web' ? 58 : 70,
        paddingBottom: Platform.OS === 'web' ? 0 : Math.max(12, 6),
        elevation: 0, shadowColor: 'transparent',
        position: Platform.OS === 'web' ? 'absolute' as any : undefined,
      },
    }}>
      <Tabs.Screen name="index" options={{
        tabBarIcon: ({ color, size, focused }) => {
          if (isWebBen && focused) return <ActivePill><i className="ri-home-5-line" style={{ fontSize: 22, color: '#FFF' }} /></ActivePill>;
          if (isWebBen) return <i className="ri-home-5-line" style={{ fontSize: 24, color }} />;
          return <Icon name={(isAdmin || isCompany) ? 'stats-chart-outline' : 'home-outline'} size={size} color={color} />;
        },
      }} />
      <Tabs.Screen name="health" options={{
        tabBarIcon: ({ color, size, focused }) => {
          if (isWebBen && focused) return <ActivePill><i className="ri-heart-pulse-line" style={{ fontSize: 22, color: '#FFF' }} /></ActivePill>;
          if (isWebBen) return <i className="ri-heart-pulse-line" style={{ fontSize: 24, color }} />;
          return isAdmin ? <Icon name="people-outline" size={size} color={color} /> : isCompany ? <Icon name="business-outline" size={size} color={color} /> : <MCIcon name="heart-pulse" size={size} color={color} />;
        },
        href: (!isBen && !isAdmin && !isCompany) ? null : undefined,
      }} />
      <Tabs.Screen name="chat" options={{
        tabBarIcon: ({ color, size, focused }) => {
          if (isWebBen && focused) return <ActivePill><i className="ri-rocket-2-line" style={{ fontSize: 22, color: '#FFF' }} /></ActivePill>;
          if (isWebBen) return <i className="ri-rocket-2-line" style={{ fontSize: 24, color }} />;
          return <Icon name="chatbubble-ellipses-outline" size={22} color={color} />;
        },
        href: (!isBen) ? null : undefined,
      }} />
      <Tabs.Screen name="alerts" options={{
        tabBarIcon: ({ color, size }) => <Icon name={isAdmin ? 'warning-outline' : isCompany ? 'people-outline' : 'notifications-outline'} size={size} color={color} />,
        href: isBen ? null : undefined,
      }} />
      <Tabs.Screen name="teleconsult" options={{
        tabBarIcon: ({ color, size, focused }) => {
          if (isWebBen && focused) return <ActivePill><i className="ri-vidicon-line" style={{ fontSize: 22, color: '#FFF' }} /></ActivePill>;
          if (isWebBen) return <i className="ri-vidicon-line" style={{ fontSize: 24, color }} />;
          return (isAdmin || isCompany) ? <Icon name="medkit-outline" size={size} color={color} /> : isG ? <Icon name="tab-intervention" size={size} color={color} /> : <Icon name={isTA ? 'headset-outline' : 'videocam-outline'} size={size} color={color} />;
        },
      }} />
      <Tabs.Screen name="devices" options={{
        tabBarIcon: ({ color, size }) => isAdmin ? <Icon name="document-text-outline" size={size} color={color} /> : isCompany ? <Icon name="document-text-outline" size={size} color={color} /> : isG ? <Icon name="tab-subscription" size={size} color={color} /> : isTA ? <Icon name="people-outline" size={size} color={color} /> : <MCIcon name="bluetooth-connect" size={size} color={color} />,
        href: isBen ? null : undefined,
      }} />
      <Tabs.Screen name="profile" options={{
        tabBarIcon: ({ color, size, focused }) => {
          if (isWebBen && focused) return <ActivePill><i className="ri-user-line" style={{ fontSize: 22, color: '#FFF' }} /></ActivePill>;
          if (isWebBen) return <i className="ri-user-line" style={{ fontSize: 24, color }} />;
          return <Icon name="person-outline" size={size} color={color} />;
        },
      }} />
    </Tabs>
  );
}
