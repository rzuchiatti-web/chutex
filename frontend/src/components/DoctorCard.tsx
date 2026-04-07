import { Icon } from './WebIcon';
import React from 'react';
import { View, Text, TouchableOpacity, Platform, Image } from 'react-native';

const DOCTOR_IMG = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/ofxen6lz_medecin.png';
const BG_BLUE = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/v5t9l2mb_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_10_07.png';

export function DoctorCard({ onPress }: { onPress: () => void }) {
  if (Platform.OS === 'web') {
    return (
      <div data-testid="doctor-teleconsult-card" onClick={onPress} style={{
        borderRadius: 22, overflow: 'hidden', position: 'relative', cursor: 'pointer',
        minHeight: 130, display: 'flex', alignItems: 'flex-end',
        marginBottom: 14,
        border: '1.5px solid rgba(255,255,255,0.25)',
        boxShadow: '0 0 30px rgba(255,255,255,0.08), 0 0 60px rgba(167,139,250,0.06), 0 8px 40px rgba(0,0,0,0.5)',
        transition: 'transform 0.28s cubic-bezier(.22,.61,.36,1), box-shadow 0.28s cubic-bezier(.22,.61,.36,1)',
      } as any}
        onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 0 36px rgba(255,255,255,0.1), 0 0 70px rgba(167,139,250,0.08), 0 12px 48px rgba(0,0,0,0.6)'; }}
        onMouseLeave={(e: any) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 0 30px rgba(255,255,255,0.08), 0 0 60px rgba(167,139,250,0.06), 0 8px 40px rgba(0,0,0,0.5)'; }}
      >
        {/* Blue background image */}
        <img src={BG_BLUE} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 1 } as any} />

        {/* Doctor image */}
        <img src={DOCTOR_IMG} alt="" style={{
          position: 'absolute', right: -30, bottom: 0, height: '105%', width: 'auto',
          objectFit: 'contain', pointerEvents: 'none', zIndex: 2,
        } as any} />

        {/* Content */}
        <div style={{ position: 'relative', zIndex: 3, padding: '18px 16px', flex: 1, maxWidth: '52%' } as any}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF', lineHeight: 1.15, marginBottom: 4 }}>
            Teleconsultation
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,.6)', marginBottom: 12, fontWeight: 500 }}>
            Médecin 24/7
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
              <i className="ri-phone-line" style={{ fontSize: 18, color: '#1f4a7a' }} />
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
        <Text style={{ fontSize: 14, color: 'rgba(255,255,255,.7)', marginBottom: 16, fontWeight: '500' }}>Médecin disponible 24/7</Text>
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
