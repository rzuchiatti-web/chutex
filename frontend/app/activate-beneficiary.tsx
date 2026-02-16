import { Icon } from '../src/components/WebIcon';
import { useTheme } from '../src/context/ThemeContext';
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';

const WebInput = ({ label, val, onChange, placeholder, type }: any) => Platform.OS === 'web' ? (
  <div style={{ marginBottom: 16 }}>
    <div style={{ fontSize: 12, fontWeight: 600, color: '#6B7280', marginBottom: 7 }}>{label}</div>
    <input type={type || 'text'} value={val} onChange={(e: any) => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: '100%', fontSize: 15, padding: '15px 18px', borderRadius: 14, border: '1.5px solid #E5E7EB', background: '#F9FAFB', color: '#111827', fontFamily: 'inherit', boxSizing: 'border-box' as any, outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s' }} />
  </div>
) : null;

export default function ActivateBeneficiaryScreen() {
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
      {/* Gradient header */}
      <View style={{
        padding: 20, paddingTop: 16, paddingBottom: 36,
        ...(Platform.OS === 'web' ? { background: 'linear-gradient(160deg, #E8956B 0%, #D97756 30%, #C4623D 100%)' } : { backgroundColor: '#D97756' }),
      } as any}>
        <TouchableOpacity testID="back-btn" onPress={() => { if (step > 0) setStep(step - 1); else router.back(); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }}>
          <Icon name="chevron-back" size={20} color="#FFF" />
          <Text style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: '500' }}>Retour</Text>
        </TouchableOpacity>
        <Text className="enter-up" style={{ fontSize: 24, fontWeight: '800', color: '#FFFFFF', marginBottom: 4 }}>Inscription</Text>
        <Text className="enter-up d1" style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>Creez votre espace beneficiaire</Text>
      </View>

      {/* White card form overlapping */}
      <ScrollView style={{ flex: 1, backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, marginTop: -20, ...(Platform.OS === 'web' ? { boxShadow: '0 -4px 20px rgba(0,0,0,0.06)' } : {}) } as any} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 28, paddingBottom: 40 }}>
        {/* Steps */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 6, marginBottom: 6 }}>
          {[0, 1].map(i => <View key={i} style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: i <= step ? '#D97756' : '#E5E7EB' }} />)}
        </View>
        <Text style={{ fontSize: 12, color: '#9CA3AF', textAlign: 'center', marginBottom: 24 }}>Etape {step + 1} / 2</Text>

        {step === 0 && (user?.name || user?.phone) && (
          <View style={{ backgroundColor: '#ECFDF5', borderRadius: 14, padding: 14, marginBottom: 20, borderLeftWidth: 3, borderLeftColor: '#10B981' }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#059669' }}>Informations pre-remplies depuis votre profil.</Text>
          </View>
        )}

        {step === 0 && (
          <View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 20 }}>Informations personnelles</Text>
            <WebInput label="Date de naissance" val={dob} onChange={setDob} placeholder="JJ/MM/AAAA" />
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 8 }}>Genre</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 18 }}>
              {['Homme', 'Femme', 'Autre'].map(g => (
                <TouchableOpacity key={g} style={{ paddingVertical: 10, paddingHorizontal: 18, borderRadius: 9999, borderWidth: 1.5, borderColor: gender === g ? '#D97756' : '#E5E7EB', backgroundColor: gender === g ? 'rgba(217,119,86,0.08)' : '#FFFFFF' }} onPress={() => setGender(g)}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: gender === g ? '#D97756' : '#6B7280' }}>{g}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <WebInput label="Adresse" val={address} onChange={setAddress} placeholder="14 rue de la Republique, Saint-Chamond" />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}><WebInput label="Taille (cm)" val={heightCm} onChange={setHeightCm} placeholder="170" type="number" /></View>
              <View style={{ flex: 1 }}><WebInput label="Poids (kg)" val={weightKg} onChange={setWeightKg} placeholder="70" type="number" /></View>
            </View>
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#6B7280', marginBottom: 8 }}>Groupe sanguin</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
              {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(b => (
                <TouchableOpacity key={b} style={{ paddingVertical: 8, paddingHorizontal: 14, borderRadius: 9999, borderWidth: 1.5, borderColor: bloodType === b ? '#D97756' : '#E5E7EB', backgroundColor: bloodType === b ? 'rgba(217,119,86,0.08)' : '#FFFFFF' }} onPress={() => setBloodType(b)}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: bloodType === b ? '#D97756' : '#6B7280' }}>{b}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 1 && (
          <View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 20 }}>Informations medicales</Text>
            <WebInput label="Allergies connues" val={allergies} onChange={setAllergies} placeholder="Penicilline, arachides..." />
            <WebInput label="Pathologies" val={medConditions} onChange={setMedConditions} placeholder="Diabete, hypertension..." />
            <WebInput label="Medecin traitant" val={doctorName} onChange={setDoctorName} placeholder="Dr. Dupont" />
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 8, marginBottom: 16 }}>Contact d'urgence</Text>
            <WebInput label="Nom du contact" val={ecName} onChange={setEcName} placeholder="Marie Dupont" />
            <WebInput label="Telephone urgence" val={ecPhone} onChange={setEcPhone} placeholder="06 98 76 54 32" type="tel" />
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
          {step > 0 && (
            <TouchableOpacity style={{ flex: 1, paddingVertical: 14, borderRadius: 9999, backgroundColor: '#F3F4F6', alignItems: 'center' }} onPress={() => setStep(0)}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#6B7280' }}>Retour</Text>
            </TouchableOpacity>
          )}
          {step === 0 ? (
            <TouchableOpacity testID="next-step-btn" style={{ flex: 1, backgroundColor: '#1F2937', paddingVertical: 14, borderRadius: 9999, alignItems: 'center', ...(Platform.OS === 'web' ? { boxShadow: '0 2px 8px rgba(0,0,0,0.12)' } : {}) } as any} onPress={() => setStep(1)}>
              <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '600' }}>Suivant</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity testID="activate-btn" style={{ flex: 1, backgroundColor: '#D97756', paddingVertical: 14, borderRadius: 9999, alignItems: 'center', ...(Platform.OS === 'web' ? { boxShadow: '0 2px 8px rgba(217,119,86,0.25)' } : {}) } as any} onPress={submit} disabled={saving}>
              {saving ? <ActivityIndicator color="#FFF" /> : <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '600' }}>Activer mon espace</Text>}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
