import React from 'react';
import { Tabs } from 'expo-router';
import { Icon, MCIcon } from '../../src/components/WebIcon';
import { useAuth } from '../../src/context/AuthContext';
import { View, ActivityIndicator, Platform } from 'react-native';

const DnaIcon = ({ size = 22, color = '#FFF' }: { size?: number; color?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={color} width={size} height={size}><path d="M18 1C18 1.71561 17.9359 2.37948 17.8155 3H8.23193C8.41382 3.72694 8.69997 4.38283 9.08066 5H17.1807C16.132 7.31672 14.1871 8.99371 12 10.7267C8.72906 8.13494 6 5.66845 6 1H4C4 6.46624 7.21013 9.46355 10.3863 12C7.21013 14.5365 4 17.5338 4 23H6C6 18.0404 9.08011 15.566 12.6178 12.7863L12.7096 12.7142C16.149 10.0123 20 6.98705 20 1H18ZM17.8155 21.0002H8.23193C8.41382 20.2733 8.69997 19.6174 9.08066 19.0002H17.1807C16.3939 17.262 15.1026 15.8839 13.583 14.5721C14.1162 14.1516 14.6526 13.7351 15.1811 13.3086C17.7659 15.5981 20 18.44 20 23.0002H18C18 22.2846 17.9359 21.6207 17.8155 21.0002Z" /></svg>
);

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

  const NavIcon = ({ icon, focused, children }: { icon?: string; focused: boolean; children?: any }) => {
    if (!isWebBen) return children || <Icon name={icon || 'ellipse'} size={22} color={focused ? '#FFF' : 'rgba(255,255,255,0.45)'} />;
    return (
      <div style={{
        width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: focused ? 'rgba(255,255,255,0.15)' : 'transparent',
        transition: 'all 0.25s cubic-bezier(.22,.61,.36,1)',
      } as any}>
        {children || <i className={icon} style={{ fontSize: 22, color: focused ? '#FFF' : 'rgba(255,255,255,0.4)', transition: 'color 0.2s' }} />}
      </div>
    );
  };

  return (
    <Tabs key={r} sceneContainerStyle={{ backgroundColor: 'transparent' }} screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#FFFFFF',
      tabBarInactiveTintColor: 'rgba(255,255,255,0.40)',
      tabBarShowLabel: false,
      tabBarStyle: isWebBen ? {
        position: 'absolute' as any,
        bottom: 16,
        left: '50%' as any,
        transform: [{ translateX: -180 }],
        width: 360,
        height: 64,
        borderRadius: 22,
        borderTopWidth: 0,
        elevation: 0,
        shadowColor: 'transparent',
        backgroundColor: 'rgba(255,255,255,0.08)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.12)',
        paddingHorizontal: 8,
        paddingBottom: 0,
        ...(Platform.OS === 'web' ? {
          backdropFilter: 'blur(24px) saturate(140%)',
          WebkitBackdropFilter: 'blur(24px) saturate(140%)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.08)',
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
        tabBarIcon: ({ color, size, focused }) => (
          <NavIcon icon="ri-home-5-line" focused={focused}>
            {!isWebBen && <Icon name={(isAdmin || isCompany) ? 'stats-chart-outline' : 'home-outline'} size={size} color={color} />}
            {isWebBen && <i className="ri-home-5-line" style={{ fontSize: 22, color: focused ? '#FFF' : 'rgba(255,255,255,0.4)' }} />}
          </NavIcon>
        ),
      }} />
      <Tabs.Screen name="health" options={{
        tabBarIcon: ({ color, size, focused }) => (
          <NavIcon focused={focused}>
            {!isWebBen ? (isAdmin ? <Icon name="people-outline" size={size} color={color} /> : isCompany ? <Icon name="business-outline" size={size} color={color} /> : <MCIcon name="heart-pulse" size={size} color={color} />) : <i className="ri-heart-pulse-line" style={{ fontSize: 22, color: focused ? '#FFF' : 'rgba(255,255,255,0.4)' }} />}
          </NavIcon>
        ),
        href: (!isBen && !isAdmin && !isCompany) ? null : undefined,
      }} />
      <Tabs.Screen name="chat" options={{
        tabBarIcon: ({ color, size, focused }) => (
          <NavIcon focused={focused}>
            {!isWebBen ? <Icon name="chatbubble-ellipses-outline" size={22} color={color} /> : <DnaIcon size={22} color={focused ? '#FFF' : 'rgba(255,255,255,0.4)'} />}
          </NavIcon>
        ),
        href: (!isBen) ? null : undefined,
      }} />
      <Tabs.Screen name="alerts" options={{
        tabBarIcon: ({ color, size }) => <Icon name={isAdmin ? 'warning-outline' : isCompany ? 'people-outline' : 'notifications-outline'} size={size} color={color} />,
        href: isBen ? null : undefined,
      }} />
      <Tabs.Screen name="teleconsult" options={{
        tabBarIcon: ({ color, size, focused }) => (
          <NavIcon focused={focused}>
            {!isWebBen ? ((isAdmin || isCompany) ? <Icon name="medkit-outline" size={size} color={color} /> : isG ? <Icon name="tab-intervention" size={size} color={color} /> : <Icon name={isTA ? 'headset-outline' : 'videocam-outline'} size={size} color={color} />) : <i className="ri-vidicon-line" style={{ fontSize: 22, color: focused ? '#FFF' : 'rgba(255,255,255,0.4)' }} />}
          </NavIcon>
        ),
      }} />
      <Tabs.Screen name="devices" options={{
        tabBarIcon: ({ color, size }) => isAdmin ? <Icon name="document-text-outline" size={size} color={color} /> : isCompany ? <Icon name="document-text-outline" size={size} color={color} /> : isG ? <Icon name="tab-subscription" size={size} color={color} /> : isTA ? <Icon name="people-outline" size={size} color={color} /> : <MCIcon name="bluetooth-connect" size={size} color={color} />,
        href: isBen ? null : undefined,
      }} />
      <Tabs.Screen name="profile" options={{
        tabBarIcon: ({ color, size, focused }) => (
          <NavIcon focused={focused}>
            {!isWebBen ? <Icon name="person-outline" size={size} color={color} /> : <i className="ri-user-line" style={{ fontSize: 22, color: focused ? '#FFF' : 'rgba(255,255,255,0.4)' }} />}
          </NavIcon>
        ),
      }} />
    </Tabs>
  );
}
