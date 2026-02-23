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

  const AIChatIcon = ({ focused }: { color: string; focused?: boolean }) => {
    if (Platform.OS !== 'web') {
      return (
        <View style={{
          width: 50, height: 50, borderRadius: 25, marginTop: -12,
          backgroundColor: focused ? 'rgba(220,200,240,0.7)' : 'rgba(235,220,245,0.5)',
          borderWidth: 1, borderColor: 'rgba(255,255,255,0.9)',
          justifyContent: 'center', alignItems: 'center',
        }}>
          <MCIcon name="creation" size={24} color={focused ? '#111' : '#333'} />
        </View>
      );
    }
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: -8,
      } as any}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%', position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'radial-gradient(65% 65% at 30% 25%, rgba(255,255,255,0.85), transparent 70%), linear-gradient(145deg, rgba(255,216,234,0.9), rgba(215,228,255,0.9))',
          border: '1px solid rgba(255,255,255,0.88)',
          boxShadow: '0 8px 16px rgba(15,23,42,0.10), inset 0 1px 0 rgba(255,255,255,0.95)',
          overflow: 'visible',
        } as any}>
          <div style={{
            position: 'absolute', inset: -3, borderRadius: '50%',
            border: '1px solid rgba(255,255,255,0.96)', pointerEvents: 'none',
          } as any} />
          <div style={{
            position: 'absolute', inset: -8, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(220,210,245,0.25), transparent 70%)',
            filter: 'blur(6px)', pointerEvents: 'none', zIndex: -1,
          } as any} />
          <i className="ri-sparkling-2-line" style={{ fontSize: 24, color: '#1e2330', lineHeight: 1 }} />
        </div>
        <span style={{
          marginTop: -5, fontSize: 8, fontWeight: 800, letterSpacing: '0.08em',
          textTransform: 'uppercase', color: '#273244',
          background: 'rgba(255,255,255,0.82)', border: '1px solid rgba(15,23,42,0.10)',
          borderRadius: 999, padding: '1.5px 5px', lineHeight: 1, zIndex: 2,
        } as any}>IA</span>
      </div>
    );
  };

  const isWebBen = Platform.OS === 'web' && isBen;

  return (
    <Tabs key={r} sceneContainerStyle={{ backgroundColor: 'transparent' }} screenOptions={{
      headerShown: false,
      tabBarActiveTintColor: isWebBen ? '#111827' : '#FFFFFF',
      tabBarInactiveTintColor: isWebBen ? 'rgba(15,23,42,0.35)' : 'rgba(255,255,255,0.45)',
      tabBarShowLabel: false,
      tabBarStyle: Platform.OS === 'web' && isBen ? {
        position: 'absolute' as any,
        bottom: 14,
        left: '50%',
        transform: [{ translateX: -195 }],
        width: 390,
        height: 60,
        borderRadius: 999,
        borderTopWidth: 0,
        elevation: 0,
        shadowColor: 'transparent',
        backgroundColor: 'rgba(255,255,255,0.74)',
        borderWidth: 1,
        borderColor: 'rgba(15,23,42,0.12)',
        paddingHorizontal: 4,
        paddingBottom: 0,
        // Web-only styles via spread
        ...(Platform.OS === 'web' ? {
          backdropFilter: 'blur(18px) saturate(150%)',
          WebkitBackdropFilter: 'blur(18px) saturate(150%)',
          boxShadow: '0 16px 26px rgba(15,23,42,0.12), inset 0 1px 0 rgba(255,255,255,0.94)',
        } as any : {}),
      } : {
        backgroundColor: 'transparent',
        borderTopWidth: 0,
        height: Platform.OS === 'web' ? 58 : 70,
        paddingBottom: Platform.OS === 'web' ? 0 : Math.max(12, 6),
        elevation: 0, shadowColor: 'transparent',
        position: Platform.OS === 'web' ? 'absolute' as any : undefined,
      },
      tabBarItemStyle: isWebBen ? {
        borderRadius: 999,
        height: 50,
        marginVertical: 4,
      } : {},
    }}>
      <Tabs.Screen name="index" options={{
        tabBarIcon: ({ color, size, focused }) => {
          if (isWebBen && focused) {
            return <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(2,6,23,0.18), inset 0 1px 0 rgba(255,255,255,0.88)' } as any}><Icon name="home-outline" size={22} color="#FFF" /></div>;
          }
          return <Icon name={(isAdmin || isCompany) ? 'stats-chart-outline' : 'home-outline'} size={size} color={color} />;
        },
      }} />
      <Tabs.Screen name="health" options={{
        tabBarIcon: ({ color, size, focused }) => {
          if (isWebBen && focused) {
            return <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(2,6,23,0.18), inset 0 1px 0 rgba(255,255,255,0.88)' } as any}><i className="ri-heart-pulse-line" style={{ fontSize: 22, color: '#FFF' }} /></div>;
          }
          return isAdmin ? <Icon name="people-outline" size={size} color={color} /> : isCompany ? <Icon name="business-outline" size={size} color={color} /> : <MCIcon name="heart-pulse" size={size} color={color} />;
        },
        href: (!isBen && !isAdmin && !isCompany) ? null : undefined,
      }} />
      <Tabs.Screen name="chat" options={{
        tabBarIcon: ({ color, focused }) => isBen ? <AIChatIcon color={color} focused={focused} /> : <Icon name="chatbubble-ellipses-outline" size={22} color={color} />,
        href: (!isBen) ? null : undefined,
      }} />
      <Tabs.Screen name="alerts" options={{
        tabBarIcon: ({ color, size }) => <Icon name={isAdmin ? 'warning-outline' : isCompany ? 'people-outline' : 'notifications-outline'} size={size} color={color} />,
        href: isBen ? null : undefined,
      }} />
      <Tabs.Screen name="teleconsult" options={{
        tabBarIcon: ({ color, size, focused }) => {
          if (isWebBen && focused) {
            return <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(2,6,23,0.18), inset 0 1px 0 rgba(255,255,255,0.88)' } as any}><Icon name="videocam-outline" size={22} color="#FFF" /></div>;
          }
          return (isAdmin || isCompany) ? <Icon name="medkit-outline" size={size} color={color} /> : isG ? <Icon name="tab-intervention" size={size} color={color} /> : <Icon name={isTA ? 'headset-outline' : 'videocam-outline'} size={size} color={color} />;
        },
      }} />
      <Tabs.Screen name="devices" options={{
        tabBarIcon: ({ color, size }) => isAdmin ? <Icon name="document-text-outline" size={size} color={color} /> : isCompany ? <Icon name="document-text-outline" size={size} color={color} /> : isG ? <Icon name="tab-subscription" size={size} color={color} /> : isTA ? <Icon name="people-outline" size={size} color={color} /> : <MCIcon name="bluetooth-connect" size={size} color={color} />,
        href: isBen ? null : undefined,
      }} />
      <Tabs.Screen name="profile" options={{
        tabBarIcon: ({ color, size, focused }) => {
          if (isWebBen && focused) {
            return <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#111827', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px rgba(2,6,23,0.18), inset 0 1px 0 rgba(255,255,255,0.88)' } as any}><Icon name="person-outline" size={22} color="#FFF" /></div>;
          }
          return <Icon name="person-outline" size={size} color={color} />;
        },
      }} />
    </Tabs>
  );
}
