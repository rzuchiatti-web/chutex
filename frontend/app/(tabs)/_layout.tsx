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

  const AIChatIcon = ({ color, focused }: { color: string; focused?: boolean }) => {
    if (Platform.OS !== 'web') {
      return (
        <View style={{
          width: 52, height: 52, borderRadius: 26, marginTop: -16,
          backgroundColor: focused ? 'rgba(255,196,224,0.55)' : 'rgba(176,208,255,0.25)',
          borderWidth: 1, borderColor: focused ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.4)',
          justifyContent: 'center', alignItems: 'center',
        }}>
          <Icon name="sparkles" size={24} color="#FFF" />
        </View>
      );
    }
    return (
      <div style={{
        width: 56, height: 56, borderRadius: '50%', marginTop: -10,
        position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${focused ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.62)'}`,
        color: '#fff',
        background: 'radial-gradient(65% 65% at 30% 25%, rgba(255,255,255,0.28), transparent 70%), linear-gradient(145deg, rgba(255,196,224,0.55), rgba(176,208,255,0.45))',
        boxShadow: focused
          ? '0 14px 24px rgba(2,6,23,0.28), inset 0 1px 0 rgba(255,255,255,0.82), 0 0 0 3px rgba(255,255,255,0.18)'
          : '0 12px 20px rgba(2,6,23,0.24), inset 0 1px 0 rgba(255,255,255,0.55)',
        transition: 'all 0.24s cubic-bezier(.22,.61,.36,1)',
        transform: focused ? 'translateY(-1px)' : 'none',
        overflow: 'visible',
      } as any}>
        {/* Outer ring */}
        <div style={{
          position: 'absolute', inset: -4, borderRadius: '50%',
          border: '1px solid rgba(255,255,255,0.40)', opacity: 0.8, pointerEvents: 'none',
        } as any} />
        {/* Glow */}
        <div style={{
          position: 'absolute', inset: -10, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(180,210,255,0.28), rgba(255,170,210,0) 70%)',
          filter: 'blur(8px)', opacity: 0.9, zIndex: -1, pointerEvents: 'none',
        } as any} />
        <i className="ri-sparkling-2-line" style={{ fontSize: 26, lineHeight: 1 }} />
        {/* IA tag */}
        <span style={{
          position: 'absolute', bottom: -6, left: '50%', transform: 'translateX(-50%)',
          fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
          color: '#fff', background: 'rgba(255,255,255,0.14)',
          border: '1px solid rgba(255,255,255,0.28)',
          backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
          borderRadius: 999, padding: '2px 6px', lineHeight: 1, pointerEvents: 'none',
        } as any}>IA</span>
      </div>
    );
  };

  const tabBarBg = Platform.OS === 'web' ? {
    backdropFilter: 'blur(18px) saturate(150%)',
    WebkitBackdropFilter: 'blur(18px) saturate(150%)',
    background: 'rgba(255,255,255,0.14)',
    borderRadius: 999,
    border: '1px solid rgba(255,255,255,0.62)',
    boxShadow: '0 16px 26px rgba(2,6,23,0.30), inset 0 1px 0 rgba(255,255,255,0.55)',
    margin: '0 auto 14px',
    maxWidth: 390,
    width: '94%',
    padding: '4px',
  } as any : {};

  return (
    <Tabs key={r} sceneContainerStyle={{ backgroundColor: 'transparent' }} screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: '#FFFFFF',
      tabBarInactiveTintColor: 'rgba(255,255,255,0.45)',
      tabBarShowLabel: false,
      tabBarStyle: {
        backgroundColor: 'transparent',
        borderTopWidth: 0,
        height: Platform.OS === 'web' ? 72 : 70,
        paddingBottom: Platform.OS === 'web' ? 0 : Math.max(12, 6),
        elevation: 0, shadowColor: 'transparent',
        position: Platform.OS === 'web' ? 'absolute' as any : undefined,
        ...tabBarBg,
      },
    }}>
      <Tabs.Screen name="index" options={{ tabBarIcon: ({ color, size }) => <Icon name={(isAdmin || isCompany) ? 'stats-chart-outline' : 'home-outline'} size={size} color={color} /> }} />
      <Tabs.Screen name="health" options={{ tabBarIcon: ({ color, size }) => isAdmin ? <Icon name="people-outline" size={size} color={color} /> : isCompany ? <Icon name="business-outline" size={size} color={color} /> : <MCIcon name="heart-pulse" size={size} color={color} />, href: (!isBen && !isAdmin && !isCompany) ? null : undefined }} />
      <Tabs.Screen name="chat" options={{ tabBarIcon: ({ color, focused }) => isBen ? <AIChatIcon color={color} focused={focused} /> : <Icon name="chatbubble-ellipses-outline" size={22} color={color} />, href: (!isBen) ? null : undefined }} />
      <Tabs.Screen name="alerts" options={{ tabBarIcon: ({ color, size }) => <Icon name={isAdmin ? 'warning-outline' : isCompany ? 'people-outline' : 'notifications-outline'} size={size} color={color} />, href: isBen ? null : undefined }} />
      <Tabs.Screen name="teleconsult" options={{ tabBarIcon: ({ color, size }) => (isAdmin || isCompany) ? <Icon name="medkit-outline" size={size} color={color} /> : isG ? <Icon name="tab-intervention" size={size} color={color} /> : <Icon name={isTA ? 'headset-outline' : 'videocam-outline'} size={size} color={color} /> }} />
      <Tabs.Screen name="devices" options={{ tabBarIcon: ({ color, size }) => isAdmin ? <Icon name="document-text-outline" size={size} color={color} /> : isCompany ? <Icon name="document-text-outline" size={size} color={color} /> : isG ? <Icon name="tab-subscription" size={size} color={color} /> : isTA ? <Icon name="people-outline" size={size} color={color} /> : <MCIcon name="bluetooth-connect" size={size} color={color} />, href: isBen ? null : undefined }} />
      <Tabs.Screen name="profile" options={{ tabBarIcon: ({ color, size }) => <Icon name="person-outline" size={size} color={color} /> }} />
    </Tabs>
  );
}
