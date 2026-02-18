import { Icon, MCIcon } from '../../src/components/WebIcon';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Platform, Image, Modal, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { apiFetch, API_URL } from '../../src/services/api';
import { useI18n } from '../../src/context/I18nContext';
import { HelpCenter } from '../../src/components/HelpSystem';

const glass = Platform.OS === 'web' ? { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', boxShadow: '0 2px 20px rgba(0,0,0,0.05)' } : {};
const GlassCard = ({ children, style }: any) => (
  <View style={[{ backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', padding: 18, marginBottom: 14, ...glass }, style]}>{children}</View>
);
const WebInput = ({ val, onChange, placeholder, type, rows }: any) => {
  if (Platform.OS === 'web') {
    return rows ? (
      <div style={{ marginBottom: 10 }}><textarea value={val} onChange={(e: any) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
        style={{ width: '100%', fontSize: 14, padding: '12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.04)', color: '#111827', fontFamily: 'system-ui', resize: 'none' as any, boxSizing: 'border-box' as any }} /></div>
    ) : (
      <div style={{ marginBottom: 10 }}><input type={type || 'text'} value={val} onChange={(e: any) => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: '100%', fontSize: 15, padding: '12px 14px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(255,255,255,0.04)', color: '#111827', fontFamily: 'system-ui', boxSizing: 'border-box' as any }} /></div>
    );
  }
  const { TextInput: RNTextInput } = require('react-native');
  return (
    <View style={{ marginBottom: 10 }}>
      <RNTextInput value={val} onChangeText={onChange} placeholder={placeholder} placeholderTextColor="rgba(255,255,255,0.30)"
        secureTextEntry={type === 'password'} autoCapitalize="none" multiline={!!rows} numberOfLines={rows || 1}
        keyboardType={type === 'email' ? 'email-address' : type === 'tel' ? 'phone-pad' : 'default'}
        style={{ fontSize: 15, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', backgroundColor: '#FFFFFF', color: '#111827' }} />
    </View>
  );
};

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
  const [showNotifPrefs, setShowNotifPrefs] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState<any>(null);
  const [savingNotif, setSavingNotif] = useState(false);

  const fetchNotifPrefs = useCallback(async () => {
    try { setNotifPrefs(await apiFetch('/api/push/preferences', {}, token)); } catch {}
  }, [token]);
  
  const toggleNotifPref = async (key: string, value: boolean) => {
    setNotifPrefs({ ...notifPrefs, [key]: value });
    setSavingNotif(true);
    try { await apiFetch('/api/push/preferences', { method: 'PUT', body: JSON.stringify({ [key]: value }) }, token); } catch {} finally { setSavingNotif(false); }
  };

  const testPush = async () => {
    try { await apiFetch('/api/push/test', { method: 'POST' }, token); Alert.alert('Notification envoyee', 'Verifiez votre appareil !'); } catch (e: any) { Alert.alert('Erreur', e.message); }
  };

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

const BG_PROFILE = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/2l2wimir_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2020_02_41.png';

  const effectiveRole = user.active_role || user.role;
  const isBen = effectiveRole === 'beneficiary';
  const isGuardian = effectiveRole === 'guardian';
  const roleName = isBen ? t('beneficiary') : isGuardian ? t('guardian') : effectiveRole === 'teleassistance' ? 'Teleassistance' : effectiveRole === 'admin' ? 'Administrateur' : 'Company';
  const otherRole = isBen ? 'gardien' : 'beneficiaire';
  const hasOther = (effectiveRole === 'prescriber_company' || effectiveRole === 'admin' || effectiveRole === 'teleassistance') ? false
    : isBen ? user.has_guardian_space : (user.has_beneficiary_space || user.role === 'beneficiary');

  const MenuItem = ({ icon, label, onPress, danger, testID }: any) => {
    if (Platform.OS === 'web') {
      return (
        <div data-testid={testID} onClick={onPress} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' } as any}
          onMouseEnter={(e: any) => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
          onMouseLeave={(e: any) => { e.currentTarget.style.background = 'transparent'; }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: danger ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.06)', border: `1px solid ${danger ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
            <i className={danger ? 'ri-logout-box-r-line' : icon} style={{ fontSize: 16, color: danger ? '#EF4444' : 'rgba(0,0,0,0.7)' }} />
          </div>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: danger ? '#EF4444' : '#111' }}>{label}</span>
          <i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: 'rgba(0,0,0,0.25)' }} />
        </div>
      );
    }
    return (
      <TouchableOpacity testID={testID} style={{ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: 'rgba(0,0,0,0.04)' }} onPress={onPress}>
        <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: danger ? 'rgba(239,68,68,0.08)' : 'rgba(0,0,0,0.08)', justifyContent: 'center', alignItems: 'center' }}>
          <Icon name={icon} size={18} color={danger ? '#EF4444' : '#111827'} />
        </View>
        <Text style={{ flex: 1, fontSize: 15, fontWeight: '600', color: danger ? '#EF4444' : '#111827' }}>{label}</Text>
        <Icon name="chevron-forward" size={16} color="#9CA3AF" />
      </TouchableOpacity>
    );
  };

  /* ─── WEB: Full-page profile with satin background ─── */
  if (Platform.OS === 'web') {
    return (
      <div data-testid="profile-screen" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
        <img src={BG_PROFILE} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.08)', zIndex: 1 } as any} />

        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '24px 20px 100px', WebkitOverflowScrolling: 'touch' } as any} data-animate>

          {/* Avatar + Name + Role pills */}
          <div style={{ textAlign: 'center', marginBottom: 20 } as any}>
            <div onClick={handleAvatarUpload} data-testid="avatar-upload-btn" style={{ position: 'relative', display: 'inline-block', cursor: 'pointer', marginBottom: 12 } as any}>
              <div style={{ width: 80, height: 80, borderRadius: 999, background: 'linear-gradient(135deg, #D4845A, #E8A87C)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '3px solid rgba(255,255,255,0.3)', boxShadow: '0 8px 24px rgba(0,0,0,0.15)' } as any}>
                {user.avatar_url ? <img src={user.avatar_url} style={{ width: 80, height: 80, objectFit: 'cover' } as any} /> : <span style={{ fontSize: 32, fontWeight: 800, color: '#FFF' }}>{user.name?.charAt(0)?.toUpperCase()}</span>}
              </div>
              <div style={{ position: 'absolute', bottom: -2, right: -4, width: 28, height: 28, borderRadius: 999, background: '#FFF', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' } as any}>
                {uploading ? <i className="ri-loader-4-line" style={{ fontSize: 14, color: '#111' }} /> : <i className="ri-camera-line" style={{ fontSize: 14, color: '#111' }} />}
              </div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#111' }}>{user.name}</div>

            {/* Role pills */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' } as any}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 999, background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.08)' } as any}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#555' }}>{roleName}</span>
              </div>
              {/* Beneficiary: subscription pill */}
              {isBen && user.has_subscription && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 999, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)' } as any}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' } as any} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#10B981' }}>Abonnement {user.subscription_type || 'Standard'}</span>
                </div>
              )}
              {/* Guardian: Care pill */}
              {isGuardian && user.guardian_type === 'professional' && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 999, background: 'rgba(124,92,255,0.15)', border: '1px solid rgba(124,92,255,0.3)' } as any}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#A78BFA' }}>Care</span>
                </div>
              )}
              {/* Guardian: Prescriber pill */}
              {isGuardian && user.is_prescriber && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 999, background: 'rgba(212,132,90,0.15)', border: '1px solid rgba(212,132,90,0.3)' } as any}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#D4845A' }}>Prescripteur</span>
                </div>
              )}
            </div>
          </div>

          {/* Menu items — glass card */}
          <div style={{ padding: '4px 18px', borderRadius: 22, background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.6)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', marginBottom: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' } as any}>
            <MenuItem testID="edit-profile-btn" icon="ri-user-settings-line" label={t('modify_profile')} onPress={() => { setEditName(user.name); setEditPhone(user.phone || ''); setEditAddress(user.address || ''); setEditMode(true); }} />
            <MenuItem icon="ri-lock-line" label={t('security')} onPress={() => setShowPwChange(true)} />
            {effectiveRole !== 'prescriber_company' && effectiveRole !== 'admin' && effectiveRole !== 'teleassistance' && (
              <MenuItem testID="switch-role-btn" icon="ri-swap-line" label={otherRole === 'gardien' ? t('my_guardian_space') : t('my_beneficiary_space')} onPress={async () => {
                if (hasOther) {
                  try { await apiFetch('/api/auth/switch-role', { method: 'POST', body: JSON.stringify({ role: otherRole === 'gardien' ? 'guardian' : 'beneficiary' }) }, token); await refreshUser(); } catch (e: any) { Alert.alert('Erreur', e.message); }
                } else { router.push(otherRole === 'gardien' ? '/activate-guardian' : '/activate-beneficiary' as any); }
              }} />
            )}
            <MenuItem icon="ri-translate-2" label={`${t('language')} (${lang})`} onPress={() => setShowLangPicker(true)} />
            <MenuItem testID="notif-prefs-btn" icon="ri-notification-3-line" label="Notifications" onPress={() => { setShowNotifPrefs(true); fetchNotifPrefs(); }} />
          </div>

          {/* Second card */}
          <div style={{ padding: '4px 18px', borderRadius: 22, background: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.6)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', marginBottom: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.06)' } as any}>
            <MenuItem icon="ri-file-text-line" label={t('terms')} onPress={() => Alert.alert('CGU', 'Les conditions generales seront disponibles prochainement.')} />
            <MenuItem icon="ri-question-line" label="Centre d'aide" onPress={() => setShowHelp(true)} />
            <MenuItem icon="ri-mail-line" label={t('support')} onPress={() => setShowContact(true)} />
            <MenuItem icon="ri-information-line" label={`${t('about')} - Chutex v3.0`} onPress={() => Alert.alert('CHUTEX', 'Version 3.0\nChutex Innovation SAS')} />
          </div>

          {/* Logout */}
          <div data-testid="logout-btn" onClick={logout} style={{ padding: '16px', borderRadius: 999, textAlign: 'center', cursor: 'pointer', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 4 } as any}
            onMouseEnter={(e: any) => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; }}
            onMouseLeave={(e: any) => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; }}>
            <i className="ri-logout-box-r-line" style={{ fontSize: 16, color: '#EF4444' }} />
            <span style={{ fontSize: 15, fontWeight: 800, color: '#EF4444' }}>{t('logout')}</span>
          </div>
          <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(0,0,0,0.3)', marginTop: 16 }}>Chutex Innovation SAS - v3.0</div>

          {/* Edit/PW/Contact forms — rendered as overlays */}
          {editMode && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 } as any} onClick={() => setEditMode(false)}>
              <div onClick={(e: any) => e.stopPropagation()} style={{ background: '#FFF', borderRadius: 24, padding: 24, width: '100%', maxWidth: 380 } as any}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#111', marginBottom: 14 }}>{t('modify_profile')}</div>
                <WebInput val={editName} onChange={setEditName} placeholder="Nom complet" />
                <WebInput val={editPhone} onChange={setEditPhone} placeholder="Telephone" type="tel" />
                <WebInput val={editAddress} onChange={setEditAddress} placeholder="Adresse" />
                <div style={{ display: 'flex', gap: 10, marginTop: 8 } as any}>
                  <div onClick={() => setEditMode(false)} style={{ flex: 1, padding: '12px', borderRadius: 999, textAlign: 'center', background: 'rgba(0,0,0,0.06)', color: '#555', fontWeight: 700, cursor: 'pointer' } as any}>{t('cancel')}</div>
                  <div onClick={saveProfile} style={{ flex: 1, padding: '12px', borderRadius: 999, textAlign: 'center', background: '#111', color: '#FFF', fontWeight: 700, cursor: 'pointer' } as any}>{saving ? '...' : 'Enregistrer'}</div>
                </div>
              </div>
            </div>
          )}

          {showPwChange && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 } as any} onClick={() => setShowPwChange(false)}>
              <div onClick={(e: any) => e.stopPropagation()} style={{ background: '#FFF', borderRadius: 24, padding: 24, width: '100%', maxWidth: 380 } as any}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#111', marginBottom: 14 }}>{t('security')}</div>
                <WebInput val={oldPw} onChange={setOldPw} placeholder="Mot de passe actuel" type="password" />
                <WebInput val={newPw} onChange={setNewPw} placeholder="Nouveau mot de passe" type="password" />
                <div style={{ display: 'flex', gap: 10, marginTop: 8 } as any}>
                  <div onClick={() => setShowPwChange(false)} style={{ flex: 1, padding: '12px', borderRadius: 999, textAlign: 'center', background: 'rgba(0,0,0,0.06)', color: '#555', fontWeight: 700, cursor: 'pointer' } as any}>{t('cancel')}</div>
                  <div onClick={changePassword} style={{ flex: 1, padding: '12px', borderRadius: 999, textAlign: 'center', background: '#111', color: '#FFF', fontWeight: 700, cursor: 'pointer' } as any}>Confirmer</div>
                </div>
              </div>
            </div>
          )}

          {showContact && (
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 } as any} onClick={() => setShowContact(false)}>
              <div onClick={(e: any) => e.stopPropagation()} style={{ background: '#FFF', borderRadius: 24, padding: 24, width: '100%', maxWidth: 380, maxHeight: '80vh', overflowY: 'auto' } as any}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#111', marginBottom: 4 }}>{t('support')}</div>
                <div style={{ fontSize: 12, color: '#888', marginBottom: 14 }}>contact@chutex-innovation.com</div>
                <WebInput val={contactObj} onChange={setContactObj} placeholder="Objet" />
                <WebInput val={contactName} onChange={setContactName} placeholder="Nom" />
                <WebInput val={contactEmail} onChange={setContactEmail} placeholder="Email" type="email" />
                <WebInput val={contactMsg} onChange={setContactMsg} placeholder="Message..." rows={4} />
                <div style={{ display: 'flex', gap: 10, marginTop: 8 } as any}>
                  <div onClick={() => setShowContact(false)} style={{ flex: 1, padding: '12px', borderRadius: 999, textAlign: 'center', background: 'rgba(0,0,0,0.06)', color: '#555', fontWeight: 700, cursor: 'pointer' } as any}>{t('cancel')}</div>
                  <div onClick={sendContactForm} style={{ flex: 1, padding: '12px', borderRadius: 999, textAlign: 'center', background: '#111', color: '#FFF', fontWeight: 700, cursor: 'pointer' } as any}>{sendingContact ? '...' : 'Envoyer'}</div>
                </div>
              </div>
            </div>
          )}

          <HelpCenter visible={showHelp} onClose={() => setShowHelp(false)} />
        </div>
      </div>
    );
  }

  /* ─── NATIVE FALLBACK ─── */
  return (
    <View style={{ flex: 1, backgroundColor: '#FFFFFF' }} testID="profile-screen">
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
        <Text style={{ fontSize: 28, fontWeight: '900', color: '#111827', marginTop: 16, marginBottom: 20 }}>{t('profile')}</Text>
        <GlassCard style={{ alignItems: 'center', padding: 28 }}>
          <TouchableOpacity onPress={handleAvatarUpload} style={{ position: 'relative' }}>
            <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#D4845A', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
              {user.avatar_url ? <Image source={{ uri: user.avatar_url }} style={{ width: 80, height: 80 }} /> : <Text style={{ fontSize: 32, fontWeight: '800', color: '#FFF' }}>{user.name?.charAt(0)?.toUpperCase()}</Text>}
            </View>
          </TouchableOpacity>
          <Text style={{ fontSize: 22, fontWeight: '900', color: '#111827', marginTop: 12 }}>{user.name}</Text>
          <View style={{ marginTop: 6, paddingHorizontal: 14, paddingVertical: 4, borderRadius: 9999, backgroundColor: 'rgba(0,0,0,0.06)' }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#555' }}>{roleName}</Text>
          </View>
        </GlassCard>
        <GlassCard>
          <MenuItem icon="person-outline" label={t('modify_profile')} onPress={() => setEditMode(true)} />
          <MenuItem icon="lock-closed-outline" label={t('security')} onPress={() => setShowPwChange(true)} />
          <MenuItem icon="notifications-outline" label="Notifications" onPress={() => { setShowNotifPrefs(true); fetchNotifPrefs(); }} />
        </GlassCard>
        <TouchableOpacity style={{ backgroundColor: '#EF4444', borderRadius: 9999, paddingVertical: 16, alignItems: 'center', marginTop: 8 }} onPress={logout}>
          <Text style={{ fontSize: 15, fontWeight: '800', color: '#FFF' }}>{t('logout')}</Text>
        </TouchableOpacity>
      </ScrollView>

      <Modal visible={showNotifPrefs} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '85%' }}>
            <TouchableOpacity onPress={() => setShowNotifPrefs(false)}><Text style={{ textAlign: 'right', color: '#888', fontSize: 16 }}>Fermer</Text></TouchableOpacity>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#111', marginBottom: 16 }}>Notifications</Text>
            {notifPrefs ? (
              <ScrollView>{['sos_alerts','fall_detection','health_thresholds','low_battery'].map(key => (
                <View key={key} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: '#EEE' }}>
                  <Text style={{ flex: 1, fontSize: 14, color: '#111' }}>{key.replace(/_/g, ' ')}</Text>
                  <Switch value={notifPrefs[key] ?? true} onValueChange={(v) => toggleNotifPref(key, v)} />
                </View>
              ))}</ScrollView>
            ) : <ActivityIndicator size="large" color="#111" style={{ paddingVertical: 40 }} />}
          </View>
        </View>
      </Modal>
    </View>
  );
}