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
  const [showCareDetail, setShowCareDetail] = useState(false);
  const [subData, setSubData] = useState<any>(null);

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
            <i className={danger ? 'ri-logout-box-r-line' : icon} style={{ fontSize: 16, color: danger ? '#EF4444' : 'rgba(255,255,255,0.6)' }} />
          </div>
          <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: danger ? '#EF4444' : '#FFF' }}>{label}</span>
          <i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.2)' }} />
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

  /* ─── WEB: Full-page profile with dark background ─── */
  if (Platform.OS === 'web') {
    const BG_DARK = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/j2b92wwx_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2015_59_23.png';

    const GlassPopup = ({ visible, onClose, children }: any) => !visible ? null : (
      <div onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.2)', overflowY: 'scroll', WebkitOverflowScrolling: 'touch' } as any}>
        <div onClick={(e: any) => e.stopPropagation()} className="anim-up" style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: '40px 28px 120px', boxSizing: 'border-box' } as any}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}>
            <div onClick={onClose} style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div>
          </div>
          {children}
        </div>
      </div>
    );

    return (
      <div data-testid="profile-screen" style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', overflow: 'hidden' } as any}>
        <img src={BG_DARK} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 } as any} />
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 1 } as any} />

        <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, padding: '24px 20px 100px', WebkitOverflowScrolling: 'touch' } as any} data-animate>

          {/* Avatar + Name + Role pills */}
          <div style={{ textAlign: 'center', marginBottom: 24 } as any}>
            <div onClick={handleAvatarUpload} data-testid="avatar-upload-btn" style={{ position: 'relative', display: 'inline-block', cursor: 'pointer', marginBottom: 12 } as any}>
              <div style={{ width: 80, height: 80, borderRadius: 999, background: 'linear-gradient(135deg, #D4845A, #E8A87C)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '3px solid rgba(255,255,255,0.2)', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' } as any}>
                {user.avatar_url ? <img src={user.avatar_url} style={{ width: 80, height: 80, objectFit: 'cover' } as any} /> : <span style={{ fontSize: 32, fontWeight: 800, color: '#FFF' }}>{user.name?.charAt(0)?.toUpperCase()}</span>}
              </div>
              <div style={{ position: 'absolute', bottom: -2, right: -4, width: 28, height: 28, borderRadius: 999, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
                {uploading ? <i className="ri-loader-4-line" style={{ fontSize: 14, color: '#FFF' }} /> : <i className="ri-camera-line" style={{ fontSize: 14, color: '#FFF' }} />}
              </div>
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#FFF' }}>{user.name}</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 10, flexWrap: 'wrap' } as any}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)' } as any}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.7)' }}>{roleName}</span>
              </div>
              {isGuardian && user.guardian_type === 'professional' && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 999, background: 'rgba(124,92,255,0.15)', border: '1px solid rgba(124,92,255,0.3)' } as any}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#A78BFA' }}>Care</span>
                </div>
              )}
              {isGuardian && user.is_prescriber && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 999, background: 'rgba(212,132,90,0.15)', border: '1px solid rgba(212,132,90,0.3)' } as any}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#D4845A' }}>Prescripteur</span>
                </div>
              )}
            </div>
          </div>

          {/* Care subscription card — beneficiary only */}
          {isBen && user.has_subscription && (
            <div onClick={() => { setShowCareDetail(true); if (!subData) apiFetch('/api/subscriptions/my', {}, token).then(setSubData).catch(() => {}); }} data-testid="care-subscription-card" style={{ position: 'relative', overflow: 'hidden', borderRadius: 22, padding: '20px 18px', marginBottom: 14, cursor: 'pointer', background: 'linear-gradient(135deg, rgba(124,92,255,0.25), rgba(139,92,246,0.15))', border: '1px solid rgba(124,92,255,0.35)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', transition: 'transform 0.15s' } as any}
              onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'scale(1.01)'; }}
              onMouseLeave={(e: any) => { e.currentTarget.style.transform = 'scale(1)'; }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 } as any}>
                <div style={{ width: 50, height: 50, borderRadius: 16, background: 'rgba(124,92,255,0.25)', border: '1px solid rgba(124,92,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                  <i className="ri-shield-star-line" style={{ fontSize: 24, color: '#A78BFA' }} />
                </div>
                <div style={{ flex: 1 } as any}>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#FFF' }}>Abonnement Care</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>Teleassistance 24/7 · Intervenants Care</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 } as any}>
                  <div style={{ padding: '4px 12px', borderRadius: 999, background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.3)' } as any}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#10B981' }}>ACTIF</span>
                  </div>
                  <i className="ri-arrow-right-s-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.3)' }} />
                </div>
              </div>
            </div>
          )}

          {/* Menu items — dark glass card */}
          <div style={{ padding: '4px 18px', borderRadius: 22, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', marginBottom: 14 } as any}>
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
          <div style={{ padding: '4px 18px', borderRadius: 22, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', marginBottom: 14 } as any}>
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
          <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 16 }}>Chutex Innovation SAS - v3.0</div>

          {/* GLASS POPUPS */}
          <GlassPopup visible={editMode} onClose={() => setEditMode(false)}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>{t('modify_profile')}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#FFF', marginBottom: 20 }}>{user.name}</div>
            {[{ val: editName, set: setEditName, label: 'Nom complet', icon: 'ri-user-line' }, { val: editPhone, set: setEditPhone, label: 'Telephone', icon: 'ri-phone-line' }, { val: editAddress, set: setEditAddress, label: 'Adresse', icon: 'ri-map-pin-line' }].map((f, i) => (
              <div key={i} style={{ marginBottom: 12 } as any}>
                <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{f.label}</div>
                <input value={f.val} onChange={(e: any) => f.set(e.target.value)} style={{ width: '100%', fontSize: 15, padding: '14px 16px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#FFF', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' } as any} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 16 } as any}>
              <div onClick={() => setEditMode(false)} style={{ flex: 1, padding: '14px', borderRadius: 999, textAlign: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontWeight: 700, cursor: 'pointer' } as any}>{t('cancel')}</div>
              <div onClick={saveProfile} style={{ flex: 1, padding: '14px', borderRadius: 999, textAlign: 'center', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF', fontWeight: 700, cursor: 'pointer' } as any}>{saving ? '...' : 'Enregistrer'}</div>
            </div>
          </GlassPopup>

          <GlassPopup visible={showPwChange} onClose={() => setShowPwChange(false)}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>{t('security')}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#FFF', marginBottom: 20 }}>Mot de passe</div>
            {[{ val: oldPw, set: setOldPw, label: 'Mot de passe actuel' }, { val: newPw, set: setNewPw, label: 'Nouveau mot de passe' }].map((f, i) => (
              <div key={i} style={{ marginBottom: 12 } as any}>
                <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{f.label}</div>
                <input type="password" value={f.val} onChange={(e: any) => f.set(e.target.value)} style={{ width: '100%', fontSize: 15, padding: '14px 16px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#FFF', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' } as any} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 16 } as any}>
              <div onClick={() => setShowPwChange(false)} style={{ flex: 1, padding: '14px', borderRadius: 999, textAlign: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontWeight: 700, cursor: 'pointer' } as any}>{t('cancel')}</div>
              <div onClick={changePassword} style={{ flex: 1, padding: '14px', borderRadius: 999, textAlign: 'center', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF', fontWeight: 700, cursor: 'pointer' } as any}>Confirmer</div>
            </div>
          </GlassPopup>

          <GlassPopup visible={showContact} onClose={() => setShowContact(false)}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>{t('support')}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#FFF', marginBottom: 4 }}>Assistance</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>contact@chutex-innovation.com</div>
            {[{ val: contactObj, set: setContactObj, label: 'Objet' }, { val: contactName, set: setContactName, label: 'Nom' }, { val: contactEmail, set: setContactEmail, label: 'Email' }].map((f, i) => (
              <div key={i} style={{ marginBottom: 12 } as any}>
                <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{f.label}</div>
                <input value={f.val} onChange={(e: any) => f.set(e.target.value)} style={{ width: '100%', fontSize: 15, padding: '14px 16px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#FFF', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' } as any} />
              </div>
            ))}
            <div style={{ marginBottom: 12 } as any}>
              <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>Message</div>
              <textarea value={contactMsg} onChange={(e: any) => setContactMsg(e.target.value)} rows={4} style={{ width: '100%', fontSize: 14, padding: '14px 16px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#FFF', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', resize: 'none' } as any} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 } as any}>
              <div onClick={() => setShowContact(false)} style={{ flex: 1, padding: '14px', borderRadius: 999, textAlign: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontWeight: 700, cursor: 'pointer' } as any}>{t('cancel')}</div>
              <div onClick={sendContactForm} style={{ flex: 1, padding: '14px', borderRadius: 999, textAlign: 'center', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF', fontWeight: 700, cursor: 'pointer' } as any}>{sendingContact ? '...' : 'Envoyer'}</div>
            </div>
          </GlassPopup>

          <GlassPopup visible={showNotifPrefs} onClose={() => setShowNotifPrefs(false)}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>Notifications</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#FFF', marginBottom: 20 }}>Preferences</div>
            {notifPrefs ? ['sos_alerts','fall_detection','health_thresholds','low_battery'].map((key, i, arr) => (
              <div key={key}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0' } as any}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#FFF', textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}</span>
                  <div onClick={() => toggleNotifPref(key, !(notifPrefs[key] ?? true))} style={{ width: 44, height: 24, borderRadius: 12, background: (notifPrefs[key] ?? true) ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.1)', border: `1px solid ${(notifPrefs[key] ?? true) ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.15)'}`, cursor: 'pointer', position: 'relative', transition: 'all 0.2s' } as any}>
                    <div style={{ width: 18, height: 18, borderRadius: 9, background: (notifPrefs[key] ?? true) ? '#10B981' : 'rgba(255,255,255,0.4)', position: 'absolute', top: 2, left: (notifPrefs[key] ?? true) ? 22 : 2, transition: 'left 0.2s' } as any} />
                  </div>
                </div>
                {i < arr.length - 1 && <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' } as any} />}
              </div>
            )) : <div style={{ textAlign: 'center', padding: '30px 0' } as any}><i className="ri-loader-4-line" style={{ fontSize: 24, color: 'rgba(255,255,255,0.3)' }} /></div>}
          </GlassPopup>

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