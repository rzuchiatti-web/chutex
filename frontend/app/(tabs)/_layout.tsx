import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { View, TouchableOpacity, Text, ActivityIndicator, Platform } from 'react-native';
import { usePathname, useRouter } from 'expo-router';

function FloatingTabBar() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  if (!user) return null;

  const r = user.active_role || user.role;
  const isBen = r === 'beneficiary';
  const isG = r === 'guardian';
  const isTA = r === 'teleassistance';
  const isAdmin = r === 'admin';

  const tabs = isAdmin ? [
    { key: '/', icon: 'grid-outline', label: 'Dashboard', lib: 'ion' },
    { key: '/alerts', icon: 'notifications-outline', label: 'Alertes', lib: 'ion' },
    { key: '/devices', icon: 'document-text-outline', label: 'Prescripteurs', lib: 'ion' },
    { key: '/teleconsult', icon: 'shield-checkmark-outline', label: 'Intervenants', lib: 'ion' },
    { key: '/profile', icon: 'person-outline', label: 'Profil', lib: 'ion' },
  ] : [
    { key: '/', icon: 'home-outline', label: 'Accueil', lib: 'ion' },
    ...(isBen ? [{ key: '/health', icon: 'heart-pulse', label: 'Sante', lib: 'mci' }] : []),
    { key: '/alerts', icon: 'notifications-outline', label: 'Alertes', lib: 'ion' },
    {
      key: '/teleconsult',
      icon: isTA ? 'headset-outline' : isG ? 'map-marker-radius-outline' : 'videocam-outline',
      label: isTA ? 'Teleassist.' : isG ? 'Interventions' : 'Teleconsult.',
      lib: isG ? 'mci' : 'ion',
    },
    {
      key: '/devices',
      icon: isG ? 'document-text-outline' : isTA ? 'people-outline' : 'bluetooth-connect',
      label: isG ? 'Prescriptions' : isTA ? 'Abonnes' : 'Appareils',
      lib: isG || isTA ? 'ion' : 'mci',
    },
    { key: '/profile', icon: 'person-outline', label: 'Profil', lib: 'ion' },
  ];

  const isActive = (tabKey: string) => {
    if (tabKey === '/') return pathname === '/' || pathname === '/index' || pathname === '';
    return pathname.startsWith(tabKey);
  };

  return (
    <View
      testID="floating-tab-bar"
      style={{
        position: 'absolute',
        bottom: 12,
        left: 12,
        right: 12,
        backgroundColor: 'rgba(255,255,255,0.92)',
        borderRadius: 28,
        flexDirection: 'row',
        paddingVertical: 8,
        paddingHorizontal: 4,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.06)',
        ...(Platform.OS === 'web' ? {
          backdropFilter: 'blur(40px)',
          WebkitBackdropFilter: 'blur(40px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        } : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 16,
          elevation: 20,
        }),
        zIndex: 9999,
      }}
    >
      {tabs.map((tab) => {
        const active = isActive(tab.key);
        return (
          <TouchableOpacity
            key={tab.key}
            testID={`tab-${tab.label.toLowerCase().replace(/[^a-z]/g, '')}`}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: 4,
            }}
            onPress={() => {
              if (tab.key === '/') {
                router.replace('/(tabs)/' as any);
              } else {
                router.replace(`/(tabs)${tab.key}` as any);
              }
            }}
          >
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: active ? '#000' : 'transparent',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              {tab.lib === 'mci' ? (
                <MaterialCommunityIcons name={tab.icon as any} size={20} color={active ? '#FFF' : '#888'} />
              ) : (
                <Ionicons name={tab.icon as any} size={20} color={active ? '#FFF' : '#888'} />
              )}
            </View>
            <Text style={{
              fontSize: 9,
              fontWeight: active ? '800' : '500',
              color: active ? '#000' : '#888',
              marginTop: 2,
              letterSpacing: 0.2,
            }}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  const { user, loading } = useAuth();

  if (loading) return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F0EB' }}><ActivityIndicator size="large" color="#000" /></View>;
  if (!user) return null;

  const effectiveRole = user.active_role || user.role;

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F0EB' }}>
      <Tabs
        key={effectiveRole}
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
        }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="health" options={{ href: effectiveRole !== 'beneficiary' ? null : undefined }} />
        <Tabs.Screen name="alerts" />
        <Tabs.Screen name="teleconsult" />
        <Tabs.Screen name="devices" />
        <Tabs.Screen name="profile" />
      </Tabs>
      <FloatingTabBar />
    </View>
  );
}
