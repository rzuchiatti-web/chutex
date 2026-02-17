import { Icon } from './WebIcon';
import React from 'react';
import { View, Text, TouchableOpacity, Platform, Image } from 'react-native';

const DOCTOR_IMG = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/ofxen6lz_medecin.png';

export function DoctorCard({ onPress }: { onPress: () => void }) {
  if (Platform.OS === 'web') {
    return (
      <div data-testid="doctor-teleconsult-card" onClick={onPress} style={{
        borderRadius: 22, overflow: 'hidden', position: 'relative', cursor: 'pointer',
        background: 'linear-gradient(155deg, #5b8ec9 0%, #3a6ea5 25%, #2c5d91 50%, #1f4a7a 80%, #1a3f6b 100%)',
        minHeight: 170, display: 'flex', alignItems: 'flex-end',
        marginBottom: 14,
        boxShadow: '0 12px 28px rgba(0,0,0,.22)',
        transition: 'transform 0.28s cubic-bezier(.22,.61,.36,1), box-shadow 0.28s cubic-bezier(.22,.61,.36,1)',
      } as any}
        onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 18px 36px rgba(0,0,0,.30)'; }}
        onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,.22)'; }}
      >
        {/* Light spot top-left */}
        <div style={{ position: 'absolute', top: -30, left: -30, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,.15) 0%, transparent 70%)', pointerEvents: 'none' } as any} />

        {/* Doctor image */}
        <img src={DOCTOR_IMG} alt="" style={{
          position: 'absolute', right: -8, bottom: 0, height: '105%', width: 'auto',
          objectFit: 'contain', pointerEvents: 'none',
        } as any} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 2, padding: '22px 18px', flex: 1, maxWidth: '58%' } as any}>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#FFF', lineHeight: 1.1, marginBottom: 6 }}>
            Teleconsultation
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,.7)', marginBottom: 18, fontWeight: 500 }}>
            Medecin disponible 24/7
          </div>

          {/* Button — gray pill with white phone circle */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 0,
            borderRadius: 999, overflow: 'hidden',
            background: 'rgba(200,210,225,.35)',
            border: '1px solid rgba(255,255,255,.25)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,.2), 0 4px 12px rgba(0,0,0,.15)',
          } as any}>
            {/* Phone circle */}
            <div style={{
              width: 42, height: 42, borderRadius: '50%', background: '#FFF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: 3, boxShadow: '0 2px 8px rgba(0,0,0,.12)',
              flexShrink: 0,
            } as any}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1f4a7a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
              </svg>
            </div>
            {/* Label */}
            <span style={{ padding: '0 18px 0 10px', fontSize: 15, fontWeight: 700, color: '#FFF' }}>Consulter</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <TouchableOpacity testID="doctor-teleconsult-card" activeOpacity={0.85} onPress={onPress}
      style={{ borderRadius: 22, overflow: 'hidden', minHeight: 160, marginBottom: 14, position: 'relative', backgroundColor: '#2c5d91' }}>
      <Image source={{ uri: DOCTOR_IMG }} style={{ position: 'absolute', right: -8, bottom: 0, height: '110%', width: 160, resizeMode: 'contain' }} />
      <View style={{ padding: 20, flex: 1, maxWidth: '58%' }}>
        <Text style={{ fontSize: 22, fontWeight: '800', color: '#FFF', marginBottom: 6 }}>Teleconsultation</Text>
        <Text style={{ fontSize: 14, color: 'rgba(255,255,255,.7)', marginBottom: 16, fontWeight: '500' }}>Medecin disponible 24/7</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(200,210,225,.35)', borderRadius: 999, alignSelf: 'flex-start', borderWidth: 1, borderColor: 'rgba(255,255,255,.25)', overflow: 'hidden' }}>
          <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', margin: 3 }}>
            <Icon name="call-outline" size={18} color="#1f4a7a" />
          </View>
          <Text style={{ paddingHorizontal: 14, fontSize: 15, fontWeight: '700', color: '#FFF' }}>Consulter</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
