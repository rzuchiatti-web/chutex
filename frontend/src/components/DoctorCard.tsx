import { Icon } from './WebIcon';
import React from 'react';
import { View, Text, TouchableOpacity, Platform, Image } from 'react-native';

const DOCTOR_IMG = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/ofxen6lz_medecin.png';

export function DoctorCard({ onPress }: { onPress: () => void }) {
  if (Platform.OS === 'web') {
    return (
      <div data-testid="doctor-teleconsult-card" onClick={onPress} style={{
        borderRadius: 22, overflow: 'hidden', position: 'relative', cursor: 'pointer',
        background: 'linear-gradient(135deg, #1a3a6e 0%, #2a5298 40%, #1e3f78 100%)',
        minHeight: 160, display: 'flex', alignItems: 'flex-end',
        marginBottom: 14, border: '1px solid rgba(255,255,255,.12)',
        boxShadow: '0 12px 28px rgba(0,0,0,.25)',
        transition: 'transform 0.28s cubic-bezier(.22,.61,.36,1), box-shadow 0.28s cubic-bezier(.22,.61,.36,1)',
      } as any}
        onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 18px 36px rgba(0,0,0,.32)'; }}
        onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,.25)'; }}
      >
        {/* Doctor image — right side */}
        <img src={DOCTOR_IMG} alt="Médecin" style={{
          position: 'absolute', right: -10, bottom: 0, height: '110%', width: 'auto',
          objectFit: 'contain', pointerEvents: 'none', opacity: 0.95,
        } as any} />

        {/* Content — left side */}
        <div style={{ position: 'relative', zIndex: 2, padding: '20px 18px', flex: 1, maxWidth: '60%' } as any}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#FFF', lineHeight: 1.15, marginBottom: 6 }}>
            Teleconsultation
          </div>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,.75)', marginBottom: 16, lineHeight: 1.4 }}>
            Medecin disponible 24/7
          </div>

          {/* Glass button "Consulter" */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            padding: '10px 20px', borderRadius: 999,
            background: 'rgba(255,255,255,.15)',
            backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,.25)',
            boxShadow: '0 0 20px rgba(255,255,255,.06), inset 0 1px 0 rgba(255,255,255,.15)',
            color: '#FFF', fontSize: 14, fontWeight: 600,
            transition: 'all 0.25s ease',
          } as any}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
            Consulter
          </div>
        </div>
      </div>
    );
  }

  // Native
  return (
    <TouchableOpacity testID="doctor-teleconsult-card" activeOpacity={0.85} onPress={onPress}
      style={{ borderRadius: 22, overflow: 'hidden', backgroundColor: '#1a3a6e', minHeight: 150, marginBottom: 14, position: 'relative' }}>
      <Image source={{ uri: DOCTOR_IMG }} style={{ position: 'absolute', right: -10, bottom: 0, height: '115%', width: 160, resizeMode: 'contain' }} />
      <View style={{ padding: 18, flex: 1, maxWidth: '60%' }}>
        <Text style={{ fontSize: 20, fontWeight: '800', color: '#FFF', marginBottom: 6 }}>Teleconsultation</Text>
        <Text style={{ fontSize: 13, color: 'rgba(255,255,255,.75)', marginBottom: 14 }}>Medecin disponible 24/7</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(255,255,255,.15)', borderRadius: 999, paddingVertical: 10, paddingHorizontal: 18, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(255,255,255,.25)' }}>
          <Icon name="call-outline" size={16} color="#FFF" />
          <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '600' }}>Consulter</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
