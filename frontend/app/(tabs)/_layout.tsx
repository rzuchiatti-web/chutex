import React, { useState, useEffect } from 'react';
import { Tabs } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { View, TouchableOpacity, Text, ActivityIndicator, Platform } from 'react-native';
import { usePathname, useRouter } from 'expo-router';

function FloatingTabBar() {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [currentRole, setCurrentRole] = useState('');

  // Sync role from auth context
  const effectiveRole = user ? (user.active_role || user.role) : '';
  useEffect(() => {
    if (effectiveRole && effectiveRole !== currentRole) {
      setCurrentRole(effectiveRole);
    }
  }, [effectiveRole]);

  if (!user) return null;

  const r = currentRole || effectiveRole;
  const isBen = r === 'beneficiary';
  const isG = r === 'guardian';
  const isTA = r === 'teleassistance';
  const isAdmin = r === 'admin';

  const tabs = isAdmin ? [
    { key: 'index', icon: 'grid-outline', label: 'Dashboard', lib: 'ion' },
    { key: 'alerts', icon: 'notifications-outline', label: 'Alertes', lib: 'ion' },
    { key: 'devices', icon: 'document-text-outline', label: 'Prescripteurs', lib: 'ion' },
    { key: 'teleconsult', icon: 'shield-checkmark-outline', label: 'Intervenants', lib: 'ion' },
    { key: 'profile', icon: 'person-outline', label: 'Profil', lib: 'ion' },
  ] : [
    { key: 'index', icon: 'home-outline', label: 'Accueil', lib: 'ion' },
    ...(isBen ? [{ key: 'health', icon: 'heart-pulse', label: 'Sante', lib: 'mci' }] : []),
    { key: 'alerts', icon: 'notifications-outline', label: 'Alertes', lib: 'ion' },
    {
      key: 'teleconsult',
      icon: isTA ? 'headset-outline' : isG ? 'map-marker-radius-outline' : 'videocam-outline',
      label: isTA ? 'Teleassist.' : isG ? 'Interventions' : 'Teleconsult.',
      lib: isG ? 'mci' : 'ion',
    },
    {
      key: 'devices',
      icon: isG ? 'document-text-outline' : isTA ? 'people-outline' : 'bluetooth-connect',
      label: isG ? 'Prescriptions' : isTA ? 'Abonnes' : 'Appareils',
      lib: isG || isTA ? 'ion' : 'mci',
    },
    { key: 'profile', icon: 'person-outline', label: 'Profil', lib: 'ion' },
  ];

  const isActive = (tabKey: string) => {
    if (tabKey === 'index') return pathname === '/' || pathname === '/index' || pathname === '' || pathname === '/(tabs)' || pathname === '/(tabs)/index';
    return pathname.includes(tabKey);
  };

  return (
    <View
      key={`nav-${r}`}
      testID="floating-tab-bar"
      style={{
        position: 'absolute',
        bottom: 12,
        left: 12,
        right: 12,
        backgroundColor: 'rgba(255,255,255,0.95)',
        borderRadius: 28,
        flexDirection: 'row',
        paddingVertical: 6,
        paddingHorizontal: 2,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.08)',
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
            testID={`tab-${tab.key}`}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 }}
            onPress={() => router.replace(`/(tabs)/${tab.key === 'index' ? '' : tab.key}` as any)}
          >
            <View style={{
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: active ? '#000' : 'transparent',
              justifyContent: 'center', alignItems: 'center',
            }}>
              {tab.lib === 'mci' ? (
                <MaterialCommunityIcons name={tab.icon as any} size={18} color={active ? '#FFF' : '#999'} />
              ) : (
                <Ionicons name={tab.icon as any} size={18} color={active ? '#FFF' : '#999'} />
              )}
            </View>
            <Text style={{
              fontSize: 8, fontWeight: active ? '800' : '500',
              color: active ? '#000' : '#999', marginTop: 1,
            }} numberOfLines={1}>{tab.label}</Text>
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

  return (
    <View style={{ flex: 1, backgroundColor: '#F5F0EB' }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: 'none' },
        }}
      >
        <Tabs.Screen name="index" />
        <Tabs.Screen name="health" />
        <Tabs.Screen name="alerts" />
        <Tabs.Screen name="teleconsult" />
        <Tabs.Screen name="devices" />
        <Tabs.Screen name="profile" />
      </Tabs>
      <FloatingTabBar />
    </View>
  );
}
