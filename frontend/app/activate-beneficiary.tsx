import { Icon, MCIcon } from '../src/components/WebIcon';
import { useTheme } from '../src/context/ThemeContext';
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';

const glass = Platform.OS === 'web' ? { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', boxShadow: '0 14px 40px rgba(0,0,0,0.35)' } : {};
const GlassCard = ({ children, style }: any) => (
  <View style={[{ backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', padding: 20, marginBottom: 12, ...glass }, style]}>{children}</View>
);
const WebInput = ({ label, val, onChange, placeholder, type }: any) => Platform.OS === 'web' ? (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: 11, fontWeight: '700', color: '#6B7280', marginBottom: 6, textTransform: 'uppercase' as any, letterSpacing: 1 }}>{label}</div>
    <input type={type || 'text'} value={val} onChange={(e: any) => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: '100%', fontSize: 15, padding: '14px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.04)', fontFamily: 'system-ui', boxSizing: 'border-box' as any }} />
  </div>
) : null;

export default function ActivateBeneficiaryScreen() {
  const { colors, isDark } = useTheme();
  const { token, user, refreshUser } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [dob, setDob] = useState(user?.date_of_birth || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [address, setAddress] = useState(user?.address || '');
  const [heightCm, setHeightCm] = useState(user?.height_cm?.toString() || '');
  const [weightKg, setWeightKg] = useState(user?.weight_kg?.toString() || '');
  const [bloodType, setBloodType] = useState(user?.blood_type || '');
  const [allergies, setAllergies] = useState(user?.allergies || '');
  const [medConditions, setMedConditions] = useState(user?.medical_conditions || '');
  const [ecName, setEcName] = useState(user?.emergency_contact_name || '');
  const [ecPhone, setEcPhone] = useState(user?.emergency_contact_phone || '');
  const [doctorName, setDoctorName] = useState(user?.doctor_name || '');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    setSaving(true);
    try {
      await apiFetch('/api/auth/activate-beneficiary', { method: 'POST', body: JSON.stringify({
        date_of_birth: dob, gender, address, height_cm: heightCm ? parseFloat(heightCm) : null,
        weight_kg: weightKg ? parseFloat(weightKg) : null, blood_type: bloodType,
        allergies, medical_conditions: medConditions,
        emergency_contact_name: ecName, emergency_contact_phone: ecPhone, doctor_name: doctorName,
      }) }, token);
      await refreshUser();
      Alert.alert('Espace beneficiaire active', 'Votre espace beneficiaire est maintenant accessible.');
      router.back();
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setSaving(false); }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }} testID="activate-beneficiary-screen">
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
        <TouchableOpacity testID="back-btn" onPress={() => { if (step > 0) setStep(step - 1); else router.back(); }} style={{ padding: 4, marginRight: 12 }}>
          <Icon name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 22, fontWeight: '900', color: '#111827' }}>Espace beneficiaire</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 6 }}>
          {[0, 1].map(i => <View key={i} style={{ width: 40, height: 3, borderRadius: 2, backgroundColor: i <= step ? '#000' : '#DDD' }} />)}
        </View>
        <Text style={{ fontSize: 11, color: '#6B7280', textAlign: 'center', marginBottom: 20 }}>Etape {step + 1} / 2</Text>

        {/* Pre-filled info notice */}
        {step === 0 && (user?.name || user?.phone) && (
          <GlassCard style={{ backgroundColor: 'rgba(76,175,80,0.08)', borderLeftWidth: 4, borderLeftColor: '#4CAF50', padding: 14, marginBottom: 16 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#2E7D32' }}>Les informations connues ont ete pre-remplies depuis votre profil.</Text>
          </GlassCard>
        )}

        {step === 0 && (
          <GlassCard>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 16 }}>Informations personnelles</Text>
            <WebInput label="Date de naissance" val={dob} onChange={setDob} placeholder="JJ/MM/AAAA" />
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#6B7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Genre</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
              {['Homme', 'Femme', 'Autre'].map(g => <TouchableOpacity key={g} style={{ paddingVertical: 10, paddingHorizontal: 18, borderRadius: 9999, borderWidth: 2, borderColor: gender === g ? '#000' : '#DDD', backgroundColor: gender === g ? 'rgba(0,0,0,0.05)' : 'transparent' }} onPress={() => setGender(g)}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: gender === g ? '#000' : '#888' }}>{g}</Text>
              </TouchableOpacity>)}
            </View>
            <WebInput label="Adresse" val={address} onChange={setAddress} placeholder="14 rue de la Republique, Saint-Chamond" />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}><WebInput label="Taille (cm)" val={heightCm} onChange={setHeightCm} placeholder="170" type="number" /></View>
              <View style={{ flex: 1 }}><WebInput label="Poids (kg)" val={weightKg} onChange={setWeightKg} placeholder="70" type="number" /></View>
            </View>
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#6B7280', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Groupe sanguin</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(b => <TouchableOpacity key={b} style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 9999, borderWidth: 2, borderColor: bloodType === b ? '#000' : '#DDD', backgroundColor: bloodType === b ? 'rgba(0,0,0,0.05)' : 'transparent' }} onPress={() => setBloodType(b)}>
                <Text style={{ fontSize: 12, fontWeight: '600', color: bloodType === b ? '#000' : '#888' }}>{b}</Text>
              </TouchableOpacity>)}
            </View>
          </GlassCard>
        )}

        {step === 1 && (
          <GlassCard>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 16 }}>Informations medicales</Text>
            <WebInput label="Allergies connues" val={allergies} onChange={setAllergies} placeholder="Penicilline, arachides..." />
            <WebInput label="Pathologies" val={medConditions} onChange={setMedConditions} placeholder="Diabete, hypertension..." />
            <WebInput label="Medecin traitant" val={doctorName} onChange={setDoctorName} placeholder="Dr. Dupont" />
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#111827', marginTop: 8, marginBottom: 12 }}>Contact d'urgence</Text>
            <WebInput label="Nom du contact" val={ecName} onChange={setEcName} placeholder="Marie Dupont" />
            <WebInput label="Telephone urgence" val={ecPhone} onChange={setEcPhone} placeholder="06 98 76 54 32" type="tel" />
          </GlassCard>
        )}

        <View style={{ flexDirection: 'row', gap: 12, marginTop: 8 }}>
          {step > 0 && <TouchableOpacity style={{ flex: 1, paddingVertical: 14, borderRadius: 9999, backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center' }} onPress={() => setStep(0)}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#6B7280' }}>Retour</Text>
          </TouchableOpacity>}
          {step === 0 ? (
            <TouchableOpacity testID="next-step-btn" style={{ flex: 1, backgroundColor: '#FFFFFF', paddingVertical: 14, borderRadius: 9999, alignItems: 'center' }} onPress={() => setStep(1)}>
              <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '800' }}>SUIVANT</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity testID="activate-btn" style={{ flex: 1, backgroundColor: '#FFFFFF', paddingVertical: 14, borderRadius: 9999, alignItems: 'center' }} onPress={submit} disabled={saving}>
              {saving ? <ActivityIndicator color="#111827" /> : <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '800' }}>ACTIVER</Text>}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
