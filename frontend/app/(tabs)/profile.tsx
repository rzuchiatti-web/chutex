import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { apiFetch } from '../../src/services/api';

const glass = Platform.OS === 'web' ? { backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', boxShadow: '0 8px 32px rgba(0,0,0,0.04), inset 0 0 0 0.5px rgba(255,255,255,0.6)' } : {};
const GlassCard = ({ children, style }: any) => (
  <View style={[{ backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', padding: 18, marginBottom: 12, ...glass }, style]}>{children}</View>
);

export default function ProfileScreen() {
  const { user, token, logout } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editAddress, setEditAddress] = useState(user?.address || '');
  const [saving, setSaving] = useState(false);
  const [showPwChange, setShowPwChange] = useState(false);
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [showContact, setShowContact] = useState(false);
  const [contactMsg, setContactMsg] = useState('');
  const [sendingContact, setSendingContact] = useState(false);

  if (!user || !token) return null;

  const saveProfile = async () => {
    setSaving(true);
    try {
      await apiFetch('/api/auth/update-profile', { method: 'PUT', body: JSON.stringify({ name: editName, phone: editPhone, address: editAddress }) }, token);
      Alert.alert('Profil mis a jour'); setEditMode(false);
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (!newPw || newPw.length < 6) return Alert.alert('Erreur', 'Min. 6 caracteres');
    try {
      await apiFetch('/api/auth/change-password', { method: 'PUT', body: JSON.stringify({ old_password: oldPw, new_password: newPw }) }, token);
      Alert.alert('Mot de passe modifie'); setShowPwChange(false); setOldPw(''); setNewPw('');
    } catch (e: any) { Alert.alert('Erreur', e.message); }
  };

  const sendContactForm = async () => {
    if (!contactMsg.trim()) return Alert.alert('Erreur', 'Message requis');
    setSendingContact(true);
    try {
      await apiFetch('/api/contact', { method: 'POST', body: JSON.stringify({ message: contactMsg, email: user.email, name: user.name }) }, token);
      Alert.alert('Message envoye', 'Nous vous repondrons dans les plus brefs delais.'); setShowContact(false); setContactMsg('');
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setSendingContact(false); }
  };

  const roleName = user.role === 'beneficiary' ? 'Beneficiaire' : user.role === 'guardian' ? 'Gardien' : user.role === 'teleassistance' ? 'Teleassistance' : 'Administrateur';

  const MenuItem = ({ icon, label, onPress, danger }: any) => (
    <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.04)' }} onPress={onPress}>
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: danger ? 'rgba(229,57,53,0.08)' : 'rgba(0,0,0,0.04)', justifyContent: 'center', alignItems: 'center' }}>
        <Ionicons name={icon} size={18} color={danger ? '#E53935' : '#000'} />
      </View>
      <Text style={{ flex: 1, fontSize: 15, fontWeight: '600', color: danger ? '#E53935' : '#000' }}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color="#888" />
    </TouchableOpacity>
  );

  const WebInput = ({ val, onChange, placeholder, type }: any) => Platform.OS === 'web' ? (
    <div style={{ marginBottom: 10 }}><input type={type || 'text'} value={val} onChange={(e: any) => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: '100%', fontSize: 15, padding: '12px 14px', borderRadius: 12, border: '1.5px solid rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.5)', fontFamily: 'system-ui', boxSizing: 'border-box' as any }} /></div>
  ) : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F5F0EB' }} testID="profile-screen">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize: 28, fontWeight: '900', color: '#000', marginTop: 16, marginBottom: 20, letterSpacing: -0.5 }}>Profil</Text>

        {/* Avatar + Name */}
        <GlassCard style={{ alignItems: 'center', padding: 28 }}>
          <TouchableOpacity style={{ position: 'relative' }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 32, fontWeight: '800', color: '#FFF' }}>{user.name?.charAt(0)?.toUpperCase()}</Text>
            </View>
            <View style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: 14, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(0,0,0,0.1)' }}>
              <Ionicons name="camera-outline" size={14} color="#000" />
            </View>
          </TouchableOpacity>
          <Text style={{ fontSize: 22, fontWeight: '900', color: '#000', marginTop: 12 }}>{user.name}</Text>
          <View style={{ marginTop: 6, paddingHorizontal: 14, paddingVertical: 4, borderRadius: 9999, backgroundColor: 'rgba(0,0,0,0.06)' }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#555' }}>{roleName}</Text>
          </View>
        </GlassCard>

        {/* Edit Profile */}
        {editMode ? (
          <GlassCard>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#000', marginBottom: 14 }}>Modifier le profil</Text>
            <WebInput val={editName} onChange={setEditName} placeholder="Nom complet" />
            <WebInput val={editPhone} onChange={setEditPhone} placeholder="Telephone" type="tel" />
            <WebInput val={editAddress} onChange={setEditAddress} placeholder="Adresse" />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <TouchableOpacity style={{ flex: 1, paddingVertical: 12, borderRadius: 9999, backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center' }} onPress={() => setEditMode(false)}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#888' }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, paddingVertical: 12, borderRadius: 9999, backgroundColor: '#000', alignItems: 'center' }} onPress={saveProfile} disabled={saving}>
                {saving ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFF' }}>ENREGISTRER</Text>}
              </TouchableOpacity>
            </View>
          </GlassCard>
        ) : null}

        {/* Change Password */}
        {showPwChange ? (
          <GlassCard>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#000', marginBottom: 14 }}>Changer le mot de passe</Text>
            <WebInput val={oldPw} onChange={setOldPw} placeholder="Mot de passe actuel" type="password" />
            <WebInput val={newPw} onChange={setNewPw} placeholder="Nouveau mot de passe" type="password" />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <TouchableOpacity style={{ flex: 1, paddingVertical: 12, borderRadius: 9999, backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center' }} onPress={() => setShowPwChange(false)}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#888' }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, paddingVertical: 12, borderRadius: 9999, backgroundColor: '#000', alignItems: 'center' }} onPress={changePassword}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFF' }}>CONFIRMER</Text>
              </TouchableOpacity>
            </View>
          </GlassCard>
        ) : null}

        {/* Contact Form */}
        {showContact ? (
          <GlassCard>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#000', marginBottom: 4 }}>Assistance</Text>
            <Text style={{ fontSize: 12, color: '#888', marginBottom: 14 }}>Votre message sera envoye a contact@chutex-innovation.com</Text>
            {Platform.OS === 'web' ? (
              <div style={{ marginBottom: 12 }}><textarea value={contactMsg} onChange={(e: any) => setContactMsg(e.target.value)} placeholder="Decrivez votre probleme..." rows={4}
                style={{ width: '100%', fontSize: 14, padding: '12px', borderRadius: 14, border: '1.5px solid rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.5)', fontFamily: 'system-ui', resize: 'none' as any, boxSizing: 'border-box' as any }} /></div>
            ) : null}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={{ flex: 1, paddingVertical: 12, borderRadius: 9999, backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center' }} onPress={() => setShowContact(false)}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#888' }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, paddingVertical: 12, borderRadius: 9999, backgroundColor: '#000', alignItems: 'center' }} onPress={sendContactForm} disabled={sendingContact}>
                {sendingContact ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFF' }}>ENVOYER</Text>}
              </TouchableOpacity>
            </View>
          </GlassCard>
        ) : null}

        {/* Menu Items */}
        <GlassCard>
          <MenuItem icon="person-outline" label="Modifier mon profil" onPress={() => { setEditName(user.name); setEditPhone(user.phone || ''); setEditAddress(user.address || ''); setEditMode(true); }} />
          <MenuItem icon="lock-closed-outline" label="Securite (mot de passe)" onPress={() => setShowPwChange(true)} />
          {user.role === 'guardian' && <MenuItem icon="swap-horizontal-outline" label="Mon espace beneficiaire" onPress={() => {
            if (user.has_beneficiary_space) {
              (async () => {
                try {
                  await apiFetch('/api/auth/switch-role', { method: 'POST', body: JSON.stringify({ role: user.active_role === 'beneficiary' ? 'guardian' : 'beneficiary' }) }, token);
                  Alert.alert('Espace change', `Vous etes maintenant en mode ${user.active_role === 'beneficiary' ? 'gardien' : 'beneficiaire'}. Reconnectez-vous pour appliquer.`);
                } catch (e: any) { Alert.alert('Erreur', e.message); }
              })();
            } else {
              router.push('/activate-beneficiary' as any);
            }
          }} />
          <MenuItem icon="language-outline" label="Langue" onPress={() => Alert.alert('Langue', 'Francais / English - bientot disponible')} />
          <MenuItem icon="notifications-outline" label="Notifications" onPress={() => {}} />
          <MenuItem icon="document-text-outline" label="Conditions generales d'utilisation" onPress={() => Alert.alert('CGU', 'Les conditions generales seront disponibles prochainement.')} />
          <MenuItem icon="help-circle-outline" label="Assistance" onPress={() => setShowContact(true)} />
          <MenuItem icon="information-circle-outline" label="A propos - Chutex v3.0" onPress={() => Alert.alert('CHUTEX', 'Version 3.0\nChutex Innovation SAS\nTeleassistance intelligente')} />
        </GlassCard>

        {/* Logout */}
        <TouchableOpacity style={{ backgroundColor: '#000', borderRadius: 9999, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4, ...(Platform.OS === 'web' ? { boxShadow: '0 4px 16px rgba(0,0,0,0.15)' } : {}) }} onPress={logout}>
          <Ionicons name="log-out-outline" size={16} color="#FFF" />
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#FFF', textTransform: 'uppercase', letterSpacing: 0.5 }}>SE DECONNECTER</Text>
        </TouchableOpacity>
        <Text style={{ textAlign: 'center', fontSize: 11, color: '#888', letterSpacing: 0.5, marginTop: 16 }}>Chutex Innovation SAS - v3.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
