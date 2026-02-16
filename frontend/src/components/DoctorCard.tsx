import { Icon } from './WebIcon';
import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';

interface DoctorCardProps {
  onPress: () => void;
}

export function DoctorCard({ onPress }: DoctorCardProps) {
  return (
    <TouchableOpacity
      testID="doctor-teleconsult-card"
      activeOpacity={0.85}
      onPress={onPress}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(28,25,23,0.06)',
        padding: 18,
        marginBottom: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        ...(Platform.OS === 'web'
          ? { boxShadow: '0 2px 20px rgba(28,25,23,0.05)', transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)' }
          : { shadowColor: '#1C1917', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 20, elevation: 2 }),
      }}
    >
      <View style={{
        width: 52, height: 52, borderRadius: 18,
        backgroundColor: 'rgba(124,92,255,0.08)',
        justifyContent: 'center', alignItems: 'center',
      }}>
        <Icon name="videocam-outline" size={24} color="#7C5CFF" />
      </View>

      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#1C1917' }}>
            Teleconsultation
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(16,185,129,0.08)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999 }}>
            <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#10B981' }} />
            <Text style={{ fontSize: 9, fontWeight: '700', color: '#10B981', letterSpacing: 0.5 }}>DISPONIBLE</Text>
          </View>
        </View>
        <Text style={{ fontSize: 12, color: '#78716C', lineHeight: 16 }}>
          Medecin generaliste · 24/7
        </Text>
      </View>

      <View style={{
        width: 40, height: 40, borderRadius: 14,
        backgroundColor: '#C67A4F',
        justifyContent: 'center', alignItems: 'center',
      }}>
        <Icon name="chevron-forward" size={18} color="#FFF" />
      </View>
    </TouchableOpacity>
  );
}
