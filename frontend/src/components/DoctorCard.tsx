import React from 'react';
import { View, Text, TouchableOpacity, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DoctorCardProps {
  onPress: () => void;
}

export function DoctorCard({ onPress }: DoctorCardProps) {
  const webShadow = Platform.OS === 'web' ? { boxShadow: '0 2px 20px rgba(0,0,0,0.06)' } : {};

  return (
    <TouchableOpacity
      testID="doctor-teleconsult-card"
      activeOpacity={0.8}
      onPress={onPress}
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: 22,
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.04)',
        padding: 18,
        marginBottom: 14,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        ...webShadow,
      }}
    >
      {/* Doctor avatar */}
      <View style={{
        width: 56, height: 56, borderRadius: 28,
        backgroundColor: '#F0F1F3',
        justifyContent: 'center', alignItems: 'center',
        borderWidth: 1, borderColor: 'rgba(0,0,0,0.04)',
      }}>
        <Ionicons name="medkit" size={24} color="#1A1D21" />
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3 }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#1A1D21', letterSpacing: -0.2 }}>
            Teleconsultation
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(16,185,129,0.08)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 }}>
            <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: '#10B981' }} />
            <Text style={{ fontSize: 9, fontWeight: '700', color: '#10B981', letterSpacing: 0.5 }}>DISPONIBLE</Text>
          </View>
        </View>
        <Text style={{ fontSize: 12, color: '#5A6068', lineHeight: 16 }}>
          Medecin generaliste · Consultation 24/7
        </Text>
      </View>

      {/* CTA arrow */}
      <View style={{
        width: 36, height: 36, borderRadius: 18,
        backgroundColor: '#1A1D21',
        justifyContent: 'center', alignItems: 'center',
      }}>
        <Ionicons name="videocam" size={16} color="#FFF" />
      </View>
    </TouchableOpacity>
  );
}
