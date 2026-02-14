import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { apiFetch, API_URL } from '../../src/services/api';
import { useI18n } from '../../src/context/I18nContext';
import { HelpCenter } from '../../src/components/HelpSystem';

const glass = Platform.OS === 'web' ? { backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', boxShadow: '0 8px 32px rgba(0,0,0,0.04), inset 0 0 0 0.5px rgba(255,255,255,0.6)' } : {};
const GlassCard = ({ children, style }: any) => (
  <View style={[{ backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', padding: 18, marginBottom: 12, ...glass }, style]}>{children}</View>
);
const WebInput = ({ val, onChange, placeholder, type, rows }: any) => Platform.OS === 'web' ? (
  rows ? (
    <div style={{ marginBottom: 10 }}><textarea value={val} onChange={(e: any) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      style={{ width: '100%', fontSize: 14, padding: '12px', borderRadius: 12, border: '1.5px solid rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.5)', fontFamily: 'system-ui', resize: 'none' as any, boxSizing: 'border-box' as any }} /></div>
  ) : (
    <div style={{ marginBottom: 10 }}><input type={type || 'text'} value={val} onChange={(e: any) => onChange(e.target.value)} placeholder={placeholder}
      style={{ width: '100%', fontSize: 15, padding: '12px 14px', borderRadius: 12, border: '1.5px solid rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.5)', fontFamily: 'system-ui', boxSizing: 'border-box' as any }} /></div>
  )
) : null;

const LANGUAGES = [
  { code: 'FR', label: 'Francais', color: '#002395' },
  { code: 'EN', label: 'English', color: '#C8102E' },
  { code: 'DE', label: 'Deutsch', color: '#000000' },
  { code: 'ES', label: 'Espanol', color: '#AA151B' },
  { code: 'IT', label: 'Italiano', color: '#009246' },
];

export default function ProfileScreen() {
  const { user, token, logout, refreshUser } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const { lang, setLang, t } = useI18n();

  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editAddress, setEditAddress] = useState(user?.address || '');
  const [saving, setSaving] = useState(false);
  const [showPwChange, setShowPwChange] = useState(false);
  const [oldPw, setOldPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [showContact, setShowContact] = useState(false);
  const [contactObj, setContactObj] = useState('');
  const [contactName, setContactName] = useState(user?.name || '');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [contactPhone, setContactPhone] = useState(user?.phone || '');
  const [contactMsg, setContactMsg] = useState('');
  const [sendingContact, setSendingContact] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [uploading, setUploading] = useState(false);

  if (!user || !token) return null;

  const saveProfile = async () => {
    setSaving(true);
    try {
      const result = await apiFetch('/api/auth/update-profile', { method: 'PUT', body: JSON.stringify({ name: editName, phone: editPhone, address: editAddress }) }, token);
      if (result.user) await refreshUser();
      Alert.alert('Profil mis a jour');
      setEditMode(false);
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (!newPw || newPw.length < 6) return Alert.alert('Erreur', 'Min. 6 caracteres');
    try { await apiFetch('/api/auth/change-password', { method: 'PUT', body: JSON.stringify({ old_password: oldPw, new_password: newPw }) }, token); Alert.alert('Mot de passe modifie'); setShowPwChange(false); setOldPw(''); setNewPw(''); } catch (e: any) { Alert.alert('Erreur', e.message); }
  };

  const sendContactForm = async () => {
    if (!contactMsg.trim() || !contactObj.trim()) { if (Platform.OS === 'web') window.alert('Objet et message requis'); return; }
    setSendingContact(true);
    try { await apiFetch('/api/contact', { method: 'POST', body: JSON.stringify({ subject: contactObj, message: contactMsg, name: contactName, email: contactEmail, phone: contactPhone }) }, token); Alert.alert('Message envoye', 'Nous vous repondrons rapidement.'); setShowContact(false); setContactMsg(''); setContactObj(''); } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setSendingContact(false); }
  };

  const handleAvatarUpload = async () => {
    if (Platform.OS !== 'web') {
      Alert.alert('Info', 'Upload de photo disponible uniquement sur la version web pour le moment.');
      return;
    }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setUploading(true);
      try {
        const reader = new FileReader();
        reader.onload = async (ev) => {
          const dataUrl = ev.target?.result as string;
          await apiFetch('/api/auth/update-profile', { method: 'PUT', body: JSON.stringify({ avatar_url: dataUrl }) }, token);
          await refreshUser();
          Alert.alert('Photo mise a jour');
        };
        reader.readAsDataURL(file);
      } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setUploading(false); }
    };
    input.click();
  };

  const effectiveRole = user.active_role || user.role;
  const roleName = effectiveRole === 'beneficiary' ? t('beneficiary') : effectiveRole === 'guardian' ? t('guardian') : effectiveRole === 'teleassistance' ? 'Teleassistance' : 'Administrateur';
  const otherRole = effectiveRole === 'beneficiary' ? 'gardien' : 'beneficiaire';
  const hasOther = (effectiveRole === 'prescriber_company' || effectiveRole === 'admin' || effectiveRole === 'teleassistance') ? false
    : effectiveRole === 'beneficiary' ? user.has_guardian_space : (user.has_beneficiary_space || user.role === 'beneficiary');

  const MenuItem = ({ icon, label, onPress, danger, testID }: any) => (
    <TouchableOpacity testID={testID} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.04)' }} onPress={onPress}>
      <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: danger ? 'rgba(229,57,53,0.08)' : 'rgba(0,0,0,0.04)', justifyContent: 'center', alignItems: 'center' }}>
        <Ionicons name={icon} size={18} color={danger ? '#E53935' : '#000'} />
      </View>
      <Text style={{ flex: 1, fontSize: 15, fontWeight: '600', color: danger ? '#E53935' : '#000' }}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color="#888" />
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: 'transparent' }} testID="profile-screen">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize: 28, fontWeight: '900', color: '#000', marginTop: 16, marginBottom: 20 }}>{t('profile')}</Text>

        {/* Avatar */}
        <GlassCard style={{ alignItems: 'center', padding: 28 }}>
          <TouchableOpacity testID="avatar-upload-btn" onPress={handleAvatarUpload} style={{ position: 'relative' }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
              {user.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={{ width: 80, height: 80 }} />
              ) : (
                <Text style={{ fontSize: 32, fontWeight: '800', color: '#FFF' }}>{user.name?.charAt(0)?.toUpperCase()}</Text>
              )}
            </View>
            <View style={{ position: 'absolute', bottom: 0, right: -4, width: 28, height: 28, borderRadius: 14, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#F5F0EB' }}>
              {uploading ? <ActivityIndicator size="small" color="#FFF" /> : <Ionicons name="camera" size={14} color="#FFF" />}
            </View>
          </TouchableOpacity>
          <Text style={{ fontSize: 22, fontWeight: '900', color: '#000', marginTop: 12 }}>{user.name}</Text>
          <View style={{ marginTop: 6, paddingHorizontal: 14, paddingVertical: 4, borderRadius: 9999, backgroundColor: 'rgba(0,0,0,0.06)' }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#555' }}>{roleName}</Text>
          </View>
        </GlassCard>

        {/* Edit Profile */}
        {editMode && (
          <GlassCard>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#000', marginBottom: 14 }}>{t('modify_profile')}</Text>
            <WebInput val={editName} onChange={setEditName} placeholder="Nom complet" />
            <WebInput val={editPhone} onChange={setEditPhone} placeholder="Telephone" type="tel" />
            <WebInput val={editAddress} onChange={setEditAddress} placeholder="Adresse" />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <TouchableOpacity style={{ flex: 1, paddingVertical: 12, borderRadius: 9999, backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center' }} onPress={() => setEditMode(false)}><Text style={{ fontSize: 14, fontWeight: '700', color: '#888' }}>{t('cancel')}</Text></TouchableOpacity>
              <TouchableOpacity testID="save-profile-btn" style={{ flex: 1, paddingVertical: 12, borderRadius: 9999, backgroundColor: '#000', alignItems: 'center' }} onPress={saveProfile} disabled={saving}>{saving ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFF' }}>ENREGISTRER</Text>}</TouchableOpacity>
            </View>
          </GlassCard>
        )}

        {showPwChange && (
          <GlassCard>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#000', marginBottom: 14 }}>{t('security')}</Text>
            <WebInput val={oldPw} onChange={setOldPw} placeholder="Mot de passe actuel" type="password" />
            <WebInput val={newPw} onChange={setNewPw} placeholder="Nouveau mot de passe" type="password" />
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
              <TouchableOpacity style={{ flex: 1, paddingVertical: 12, borderRadius: 9999, backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center' }} onPress={() => setShowPwChange(false)}><Text style={{ fontSize: 14, fontWeight: '700', color: '#888' }}>{t('cancel')}</Text></TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, paddingVertical: 12, borderRadius: 9999, backgroundColor: '#000', alignItems: 'center' }} onPress={changePassword}><Text style={{ fontSize: 14, fontWeight: '700', color: '#FFF' }}>{t('confirm')}</Text></TouchableOpacity>
            </View>
          </GlassCard>
        )}

        {showContact && (
          <GlassCard>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#000', marginBottom: 4 }}>{t('support')}</Text>
            <Text style={{ fontSize: 12, color: '#888', marginBottom: 14 }}>contact@chutex-innovation.com</Text>
            <WebInput val={contactObj} onChange={setContactObj} placeholder="Objet de votre demande" />
            <WebInput val={contactName} onChange={setContactName} placeholder="Nom et prenom" />
            <WebInput val={contactEmail} onChange={setContactEmail} placeholder="Email" type="email" />
            <WebInput val={contactPhone} onChange={setContactPhone} placeholder="Telephone" type="tel" />
            <WebInput val={contactMsg} onChange={setContactMsg} placeholder="Decrivez votre probleme..." rows={4} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TouchableOpacity style={{ flex: 1, paddingVertical: 12, borderRadius: 9999, backgroundColor: 'rgba(0,0,0,0.06)', alignItems: 'center' }} onPress={() => setShowContact(false)}><Text style={{ fontSize: 14, fontWeight: '700', color: '#888' }}>{t('cancel')}</Text></TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, paddingVertical: 12, borderRadius: 9999, backgroundColor: '#000', alignItems: 'center' }} onPress={sendContactForm} disabled={sendingContact}>{sendingContact ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFF' }}>ENVOYER</Text>}</TouchableOpacity>
            </View>
          </GlassCard>
        )}

        {/* Menu */}
        <GlassCard>
          <MenuItem testID="edit-profile-btn" icon="person-outline" label={t('modify_profile')} onPress={() => { setEditName(user.name); setEditPhone(user.phone || ''); setEditAddress(user.address || ''); setEditMode(true); }} />
          <MenuItem icon="lock-closed-outline" label={t('security')} onPress={() => setShowPwChange(true)} />
          {effectiveRole !== 'prescriber_company' && effectiveRole !== 'admin' && effectiveRole !== 'teleassistance' && (
            <MenuItem testID="switch-role-btn" icon="swap-horizontal-outline" label={otherRole === 'gardien' ? t('my_guardian_space') : t('my_beneficiary_space')} onPress={async () => {
              if (hasOther) {
                try {
                  await apiFetch('/api/auth/switch-role', { method: 'POST', body: JSON.stringify({ role: otherRole === 'gardien' ? 'guardian' : 'beneficiary' }) }, token);
                  await refreshUser();
                } catch (e: any) { Alert.alert('Erreur', e.message); }
              } else {
                router.push(otherRole === 'gardien' ? '/activate-guardian' : '/activate-beneficiary' as any);
              }
            }} />
          )}
          <MenuItem icon="language-outline" label={`${t('language')} (${lang})`} onPress={() => setShowLangPicker(true)} />
          <MenuItem icon="document-text-outline" label={t('terms')} onPress={() => Alert.alert('CGU', 'Les conditions generales seront disponibles prochainement.')} />
          <MenuItem icon="help-buoy-outline" label="Centre d'aide" onPress={() => setShowHelp(true)} />
          <MenuItem icon="help-circle-outline" label={t('support')} onPress={() => setShowContact(true)} />
          <MenuItem icon="information-circle-outline" label={`${t('about')} - Chutex v3.0`} onPress={() => Alert.alert('CHUTEX', 'Version 3.0\nChutex Innovation SAS')} />
        </GlassCard>

        <TouchableOpacity testID="logout-btn" style={{ backgroundColor: '#000', borderRadius: 9999, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }} onPress={logout}>
          <Ionicons name="log-out-outline" size={16} color="#FFF" />
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#FFF', textTransform: 'uppercase' }}>{t('logout')}</Text>
        </TouchableOpacity>
        <Text style={{ textAlign: 'center', fontSize: 11, color: '#888', marginTop: 16 }}>Chutex Innovation SAS - v3.0</Text>

        <HelpCenter visible={showHelp} onClose={() => setShowHelp(false)} />

        {/* Language Picker Modal */}
        {showLangPicker && (
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24, zIndex: 100 }}>
            <View style={{ backgroundColor: '#FFF', borderRadius: 24, padding: 24 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <Text style={{ fontSize: 20, fontWeight: '900', color: '#000' }}>{t('language')}</Text>
                <TouchableOpacity onPress={() => setShowLangPicker(false)}><Ionicons name="close" size={24} color="#000" /></TouchableOpacity>
              </View>
              {LANGUAGES.map(l => (
                <TouchableOpacity key={l.code} testID={`lang-pick-${l.code}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.06)' }} onPress={() => { setLang(l.code); setShowLangPicker(false); }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: l.color, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: lang === l.code ? '#000' : 'rgba(0,0,0,0.1)' }}>
                    <Text style={{ fontSize: 11, fontWeight: '800', color: '#FFF' }}>{l.code}</Text>
                  </View>
                  <Text style={{ flex: 1, fontSize: 16, fontWeight: '600', color: '#000' }}>{l.label}</Text>
                  {lang === l.code && <Ionicons name="checkmark-circle" size={22} color="#000" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
