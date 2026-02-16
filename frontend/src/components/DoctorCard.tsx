import { Icon } from './WebIcon';
import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';

export function DoctorCard({ onPress }: { onPress: () => void }) {
  return (
    <TouchableOpacity testID="doctor-teleconsult-card" activeOpacity={0.85} onPress={onPress}
      style={{
        backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E5E7EB',
        padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', gap: 12,
        ...(Platform.OS === 'web' ? { boxShadow: '0 1px 3px rgba(0,0,0,0.08)' } : {}),
      }}>
      <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' }}>
        <Icon name="videocam-outline" size={22} color="#111827" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: '600', color: '#111827' }}>Teleconsultation</Text>
        <Text style={{ fontSize: 12, color: '#6B7280' }}>Medecin generaliste · 24/7</Text>
      </View>
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center' }}>
        <Icon name="chevron-forward" size={16} color="#FFF" />
      </View>
    </TouchableOpacity>
  );
}
