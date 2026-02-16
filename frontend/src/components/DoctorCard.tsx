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
        borderColor: 'rgba(0,0,0,0.06)',
        padding: 20,
        marginBottom: 16,
        overflow: 'hidden',
        ...(Platform.OS === 'web'
          ? { boxShadow: '0 10px 30px rgba(0,0,0,0.08)', transition: 'all 320ms cubic-bezier(0.22, 1, 0.36, 1)' }
          : { shadowColor: '#14141E', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 30, elevation: 3 }),
      }}
    >
      {/* Soft gradient top strip */}
      <View style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 4,
        ...(Platform.OS === 'web' ? { background: 'linear-gradient(90deg, #111827, #6B7280, #E5E7EB)' } : { backgroundColor: '#111827' }),
      }} />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        {/* Doctor avatar */}
        <View style={{
          width: 56, height: 56, borderRadius: 20,
          justifyContent: 'center', alignItems: 'center',
          ...(Platform.OS === 'web'
            ? { background: 'linear-gradient(135deg, rgba(124,92,255,0.12), rgba(124,92,255,0.04))', backdropFilter: 'blur(8px)' }
            : { backgroundColor: 'rgba(124,92,255,0.10)' }),
        }}>
          <Icon name="videocam-outline" size={26} color="#7C5CFF" />
        </View>

        {/* Info */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', letterSpacing: -0.2 }}>
              Teleconsultation
            </Text>
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 5,
              backgroundColor: 'rgba(16,185,129,0.08)', paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999,
            }}>
              <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#10B981' }} />
              <Text style={{ fontSize: 10, fontWeight: '600', color: '#10B981', letterSpacing: 0.3 }}>DISPONIBLE</Text>
            </View>
          </View>
          <Text style={{ fontSize: 13, color: '#6B7280', lineHeight: 18 }}>
            Medecin generaliste · Consultation 24/7
          </Text>
        </View>

        {/* CTA arrow - circular soft-raised */}
        <View style={{
          width: 42, height: 42, borderRadius: 14,
          justifyContent: 'center', alignItems: 'center',
          ...(Platform.OS === 'web'
            ? { background: 'linear-gradient(135deg, #111827, #2D2E34)', boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }
            : { backgroundColor: '#111827' }),
        }}>
          <Icon name="chevron-forward" size={18} color="#FFF" />
        </View>
      </View>
    </TouchableOpacity>
  );
}
