import { Icon, MCIcon } from '../../src/components/WebIcon';
import FullScreenLoader from '../../src/components/FullScreenLoader';
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

function ProfileMenuItem({ icon, label, onPress, danger, testID }: any) {
  if (Platform.OS === 'web') {
    return (
      <div data-testid={testID} onClick={onPress} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' } as any}>
        <div style={{ width: 38, height: 38, borderRadius: 12, background: danger ? 'rgba(239,68,68,0.12)' : 'rgba(255,255,255,0.06)', border: `1px solid ${danger ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
          <i className={danger ? 'ri-logout-box-r-line' : icon} style={{ fontSize: 16, color: danger ? '#EF4444' : 'rgba(255,255,255,0.6)' }} />
        </div>
        <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: danger ? '#EF4444' : '#FFF' }}>{label}</span>
        <i className="ri-arrow-right-s-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.15)' }} />
      </div>
    );
  }
  const { TouchableOpacity, Text, View: V } = require('react-native');
  const { Ionicons } = require('@expo/vector-icons');
  return (
    <TouchableOpacity testID={testID} onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.04)' }}>
      <V style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: danger ? '#FEE2E2' : '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginRight: 14 }}>
        <Ionicons name={icon} size={18} color={danger ? '#EF4444' : '#6B7280'} />
      </V>
      <Text style={{ flex: 1, fontSize: 15, fontWeight: '600', color: danger ? '#EF4444' : '#111' }}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color="#D1D5DB" />
    </TouchableOpacity>
  );
}

function ProfileGlassPopup({ visible, onClose, children }: any) {
  if (!visible) return null;
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.2)', overflowY: 'scroll', WebkitOverflowScrolling: 'touch' } as any}>
      <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: '40px 28px 120px', boxSizing: 'border-box' } as any}>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}>
          <div onClick={onClose} style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function ProfileScreen() {
  const { user, token, logout, refreshUser } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const { lang, setLang, t } = useI18n();

  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState(user?.name || '');
  const [editPhone, setEditPhone] = useState(user?.phone || '');
  const [editAddress, setEditAddress] = useState(user?.address || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editDob, setEditDob] = useState(user?.date_of_birth || '');
  const [editGender, setEditGender] = useState(user?.gender || '');
  const [editHeight, setEditHeight] = useState(user?.height_cm || '');
  const [editWeight, setEditWeight] = useState(user?.weight_kg || '');
  const [editEmergencyName, setEditEmergencyName] = useState(user?.emergency_contact_name || '');
  const [editEmergencyPhone, setEditEmergencyPhone] = useState(user?.emergency_contact_phone || '');
  const [editDoctor, setEditDoctor] = useState(user?.doctor_name || '');
  const [editSiret, setEditSiret] = useState(user?.siret || '');
  const [editStructure, setEditStructure] = useState(user?.structure_name || '');
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
  const [showStripeConfig, setShowStripeConfig] = useState(false);
  const [notifPrefs, setNotifPrefs] = useState<any>(null);
  const [savingNotif, setSavingNotif] = useState(false);
  const [showCareDetail, setShowCareDetail] = useState(false);
  const [showMedical, setShowMedical] = useState(false);
  const [showRGPD, setShowRGPD] = useState(false);
  const [rgpdRight, setRgpdRight] = useState('access');
  const [rgpdMsg, setRgpdMsg] = useState('');
  const [rgpdSending, setRgpdSending] = useState(false);
  const [rgpdSent, setRgpdSent] = useState(false);
  const [rgpdRef, setRgpdRef] = useState('');
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showCGU, setShowCGU] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [consentStatus, setConsentStatus] = useState<any>({});
  const [showConsent, setShowConsent] = useState(false);
  const parseMedList = (val: any): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    return val.split(',').map((s: string) => s.trim()).filter(Boolean);
  };
  const rawConditions = parseMedList(user?.medical_conditions);
  const rawAllergies = parseMedList(user?.allergies);
  const CONDITION_LIST = ['Diabete', 'Hypertension', 'Cholesterol', 'Arthrose', 'Insuffisance cardiaque', 'AVC', 'Asthme', 'Osteoporose', 'Parkinson', 'Alzheimer', 'Depression', 'Hemophilie', 'Epilepsie', 'Aucune'];
  const ALLERGY_LIST = ['Penicilline', 'Aspirine', 'Latex', 'Iode', 'Pollen', 'Acariens', 'Gluten', 'Lactose', 'Aucune'];
  const matchList = (raw: string[], list: string[]) => list.filter(item => raw.some(r => r.toLowerCase().includes(item.toLowerCase()) || item.toLowerCase().includes(r.toLowerCase())));
  const [medForm, setMedForm] = useState({
    blood_type: user?.blood_type || '',
    conditions: matchList(rawConditions, CONDITION_LIST).length > 0 ? matchList(rawConditions, CONDITION_LIST) : rawConditions,
    allergies: matchList(rawAllergies, ALLERGY_LIST).length > 0 ? matchList(rawAllergies, ALLERGY_LIST) : rawAllergies,
    pacemaker: user?.pacemaker || '',
    stents: user?.stents || '',
    thyroid: user?.thyroid || '',
    other_condition: user?.other_condition || '',
    surgeries: (user?.surgeries || []) as { zone: string; date: string }[],
  });
  const [medSaving, setMedSaving] = useState(false);
  const [medSaved, setMedSaved] = useState(false);
  const [showFaceId, setShowFaceId] = useState(false);
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
      const body: any = { name: editName, phone: editPhone, address: editAddress, email: editEmail };
      if (effectiveRole === 'prescriber_company') {
        body.structure_name = editStructure;
        body.siret = editSiret;
      } else {
        body.date_of_birth = editDob; body.gender = editGender;
        body.height_cm = editHeight; body.weight_kg = editWeight;
        body.emergency_contact_name = editEmergencyName; body.emergency_contact_phone = editEmergencyPhone;
        body.doctor_name = editDoctor;
      }
      const result = await apiFetch('/api/auth/update-profile', { method: 'PUT', body: JSON.stringify(body) }, token);
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

const BG_PROFILE = 'https://customer-assets.emergentagent.com/job_9950a869-9328-4a4b-abf4-a6fb213a3b47/artifacts/iklovqya_background_beneficiary.svg';

  const effectiveRole = user.active_role || user.role;
  const isBen = effectiveRole === 'beneficiary';
  const isGuardian = effectiveRole === 'guardian';
  const roleName = isBen ? t('beneficiary') : isGuardian ? t('guardian') : effectiveRole === 'teleassistance' ? 'Teleassistance' : effectiveRole === 'admin' ? 'Administrateur' : 'Company';
  const otherRole = isBen ? 'gardien' : 'beneficiaire';
  const hasOther = (effectiveRole === 'prescriber_company' || effectiveRole === 'admin' || effectiveRole === 'teleassistance') ? false
    : isBen ? user.has_guardian_space : (user.has_beneficiary_space || user.role === 'beneficiary');

  /* ─── WEB: Full-page profile with dark background ─── */
  if (Platform.OS === 'web') {
    const BG_DARK = 'https://customer-assets.emergentagent.com/job_9950a869-9328-4a4b-abf4-a6fb213a3b47/artifacts/iklovqya_background_beneficiary.svg';

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
              {effectiveRole !== 'prescriber_company' && effectiveRole !== 'admin' && effectiveRole !== 'teleassistance' && (
              <div data-testid="profile-role-tabs" style={{ display: 'inline-flex', borderRadius: 999, background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.12)', padding: 3, gap: 2 } as any}>
                <div onClick={async () => {
                  if (effectiveRole !== 'beneficiary') {
                    try { await apiFetch('/api/auth/switch-role', { method: 'POST', body: JSON.stringify({ role: 'beneficiary' }) }, token); await refreshUser(); } catch {}
                  }
                }} style={{ padding: '7px 16px', borderRadius: 999, cursor: 'pointer', transition: 'all 0.25s ease', background: effectiveRole === 'beneficiary' ? '#FFF' : 'transparent', boxShadow: effectiveRole === 'beneficiary' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none' } as any}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: effectiveRole === 'beneficiary' ? '#111' : 'rgba(255,255,255,0.5)' }}>Beneficiaire</span>
                </div>
                <div onClick={async () => {
                  if (effectiveRole !== 'guardian') {
                    try { await apiFetch('/api/auth/switch-role', { method: 'POST', body: JSON.stringify({ role: 'guardian' }) }, token); await refreshUser(); } catch {}
                  }
                }} style={{ padding: '7px 16px', borderRadius: 999, cursor: 'pointer', transition: 'all 0.25s ease', background: effectiveRole === 'guardian' ? '#FFF' : 'transparent', boxShadow: effectiveRole === 'guardian' ? '0 2px 8px rgba(0,0,0,0.15)' : 'none' } as any}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: effectiveRole === 'guardian' ? '#111' : 'rgba(255,255,255,0.5)' }}>Gardien</span>
                </div>
              </div>
              )}
              {effectiveRole === 'prescriber_company' && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 999, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)' } as any}>
                  <i className="ri-building-line" style={{ fontSize: 12, color: '#7C3AED' }} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#A78BFA' }}>SAAD</span>
                </div>
              )}
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
            <div onClick={() => { setShowCareDetail(true); if (!subData) apiFetch('/api/subscriptions/my', {}, token).then(setSubData).catch(() => {}); }} data-testid="care-subscription-card" style={{ position: 'relative', overflow: 'hidden', borderRadius: 22, height: 90, marginBottom: 14, cursor: 'pointer', transition: 'transform 0.15s' } as any}
              onMouseEnter={(e: any) => { e.currentTarget.style.transform = 'scale(1.01)'; }}
              onMouseLeave={(e: any) => { e.currentTarget.style.transform = 'scale(1)'; }}>
              <img src="https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/v6obzpez_ChatGPT%20Image%2018%20f%C3%A9vr.%202026%2C%2012_28_20.png" alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', borderRadius: 22 } as any} />
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)', borderRadius: 22 } as any} />
              <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '100%', padding: '0 22px' } as any}>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF', letterSpacing: -0.3 }}>Abonnement Care</div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 999, background: 'rgba(16,185,129,0.25)', border: '1px solid rgba(16,185,129,0.4)' } as any}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' } as any} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#10B981' }}>Actif</span>
                </div>
              </div>
            </div>
          )}

          {/* SAAD Stripe Connect Card */}
          {effectiveRole === 'prescriber_company' && (
            <div onClick={() => setShowStripeConfig(true)} style={{ padding: '18px 20px', borderRadius: 22, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(124,58,237,0.15)', marginBottom: 14, cursor: 'pointer', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' } as any}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 } as any}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><i className="ri-bank-card-line" style={{ fontSize: 22, color: '#7C3AED' }} /></div>
                <div style={{ flex: 1 } as any}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#FFF' }}>{user.stripe_account_id ? 'Stripe Connect' : 'Configurer les paiements'}</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{user.commission_type === 'oneshot' ? 'Commission unique (100/200 EUR)' : user.commission_type === 'monthly' ? 'Commission mensuelle (8/15 EUR)' : 'Non configure'}</div>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, background: user.stripe_account_id ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)' } as any}>
                  <span style={{ width: 5, height: 5, borderRadius: 999, background: user.stripe_account_id ? '#10B981' : '#F59E0B' } as any} />
                  <span style={{ fontSize: 10, fontWeight: 600, color: user.stripe_account_id ? '#10B981' : '#F59E0B' }}>{user.stripe_account_id ? 'Actif' : 'A configurer'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Stripe Config Popup */}
          {showStripeConfig && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.2)', overflowY: 'scroll', WebkitOverflowScrolling: 'touch' } as any}>
              <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '40px 28px 120px', boxSizing: 'border-box' } as any}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}>
                  <div onClick={() => setShowStripeConfig(false)} style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div>
                </div>

                <div style={{ textAlign: 'center', marginBottom: 24 } as any}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 } as any}><i className="ri-hand-coin-line" style={{ fontSize: 28, color: '#A78BFA' }} /></div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>Paiements & Commissions</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 6 }}>Gerez votre mode de commissionnement et votre compte Stripe</div>
                </div>

                <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Mode de commissionnement</div>
                {[
                  { k: 'oneshot', title: 'Commission unique', sub: '100 EUR par bracelet, 200 EUR bracelet + gilet', detail: 'Versement unique a la validation de la souscription', icon: 'ri-coin-line', color: '#F59E0B' },
                  { k: 'monthly', title: 'Commission mensuelle', sub: '8 EUR/mois par bracelet, 15 EUR/mois bracelet + gilet', detail: 'Versement recurrent chaque mois', icon: 'ri-loop-right-line', color: '#A78BFA' },
                ].map(o => (
                  <div key={o.k} onClick={async () => {
                    try { await apiFetch('/api/company/commission-type', { method: 'PUT', body: JSON.stringify({ commission_type: o.k }) }, token); await refreshUser(); } catch {}
                  }} style={{ padding: '16px 18px', borderRadius: 20, background: user.commission_type === o.k ? 'rgba(124,58,237,0.08)' : 'rgba(255,255,255,0.03)', border: `1.5px solid ${user.commission_type === o.k ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', marginBottom: 10 } as any}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 } as any}>
                      <div style={{ width: 44, height: 44, borderRadius: 14, background: user.commission_type === o.k ? `${o.color}20` : 'rgba(255,255,255,0.06)', border: `1px solid ${user.commission_type === o.k ? `${o.color}40` : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                        <i className={o.icon} style={{ fontSize: 22, color: user.commission_type === o.k ? o.color : 'rgba(255,255,255,0.3)' }} />
                      </div>
                      <div style={{ flex: 1 } as any}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#FFF' }}>{o.title}</div>
                        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>{o.sub}</div>
                      </div>
                      {user.commission_type === o.k && <i className="ri-checkbox-circle-fill" style={{ fontSize: 22, color: '#7C3AED', flexShrink: 0 }} />}
                    </div>
                  </div>
                ))}

                {/* Simulation */}
                <div style={{ padding: '16px 18px', borderRadius: 18, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', marginTop: 10, marginBottom: 16 } as any}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 12 }}>Simulation pour 10 prescriptions bracelet</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 } as any}>
                    <div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>{user.commission_type === 'oneshot' ? 'Gain unique' : 'Gain mensuel recurrent'}</div>
                      <div style={{ fontSize: 28, fontWeight: 900, color: '#FFF', letterSpacing: -1 }}>{user.commission_type === 'oneshot' ? '1 000' : '80'} EUR</div>
                    </div>
                    <div style={{ textAlign: 'right' } as any}>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Sur 12 mois</div>
                      <div style={{ fontSize: 20, fontWeight: 800, color: user.commission_type === 'monthly' || !user.commission_type ? '#10B981' : '#F59E0B' }}>{user.commission_type === 'oneshot' ? '1 000' : '960'} EUR</div>
                    </div>
                  </div>
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', marginBottom: 14 } as any} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' } as any}>
                    <div>
                      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Sur 24 mois</div>
                      <div style={{ fontSize: 22, fontWeight: 900, color: user.commission_type === 'monthly' || !user.commission_type ? '#10B981' : '#F59E0B' }}>{user.commission_type === 'oneshot' ? '1 000' : '1 920'} EUR</div>
                    </div>
                    {(user.commission_type === 'monthly' || !user.commission_type) && (
                      <div style={{ padding: '5px 12px', borderRadius: 999, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)' } as any}>
                        <span style={{ fontSize: 11, fontWeight: 700, color: '#10B981' }}>+920 EUR vs unique</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stripe status */}
                {user.stripe_account_id && <div style={{ padding: '14px 16px', borderRadius: 16, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 } as any}><i className="ri-shield-check-line" style={{ fontSize: 18, color: '#10B981' }} /><div style={{ flex: 1 } as any}><div style={{ fontSize: 13, fontWeight: 700, color: '#10B981' }}>Stripe Connect actif</div><div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Vos commissions sont versees automatiquement</div></div></div>}
                {!user.stripe_account_id && <div onClick={async () => {
                  try { const res = await apiFetch('/api/saad/stripe-onboarding', { method: 'POST', body: JSON.stringify({ saad_id: user.id, company_name: user.structure_name || user.name, email: user.email, commission_type: user.commission_type || 'monthly', refresh_url: window.location.href, return_url: window.location.href }) }, token); if (res.onboarding_url) window.open(res.onboarding_url, '_blank'); } catch {}
                }} style={{ padding: '17px', borderRadius: 999, background: 'linear-gradient(135deg, #10B981, #059669)', color: '#FFF', cursor: 'pointer', textAlign: 'center', fontSize: 16, fontWeight: 800, boxShadow: '0 4px 16px rgba(16,185,129,0.3)' } as any}>Connecter mon compte bancaire</div>}
              </div>
            </div>
          )}

          {/* Menu items — dark glass card */}
          <div style={{ padding: '4px 18px', borderRadius: 22, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', marginBottom: 14 } as any}>
            <ProfileMenuItem testID="edit-profile-btn" icon="ri-user-settings-line" label={t('modify_profile')} onPress={() => { setEditName(user.name); setEditPhone(user.phone || ''); setEditAddress(user.address || ''); setEditMode(true); }} />
            {effectiveRole === 'beneficiary' && <ProfileMenuItem icon="ri-heart-pulse-line" label="Dossier medical" onPress={() => { setMedForm({ blood_type: user.blood_type || '', conditions: user.medical_conditions ? user.medical_conditions.split(', ') : [], allergies: user.allergies ? user.allergies.split(', ') : [], pacemaker: user.pacemaker || '', stents: user.stents || '', thyroid: user.thyroid || '', other_condition: '', surgeries: Array.isArray(user.surgeries) ? user.surgeries : [] }); setShowMedical(true); setMedSaved(false); }} />}
            <ProfileMenuItem icon="ri-lock-line" label={t('security')} onPress={() => setShowPwChange(true)} />
            <ProfileMenuItem icon="ri-translate-2" label={`${t('language')} (${lang})`} onPress={() => setShowLangPicker(true)} />
            <ProfileMenuItem testID="notif-prefs-btn" icon="ri-notification-3-line" label="Notifications" onPress={() => { setShowNotifPrefs(true); fetchNotifPrefs(); }} />
            <ProfileMenuItem icon="ri-fingerprint-line" label="Face ID / Biometrie" onPress={() => setShowFaceId(true)} />
          </div>

          {/* Second card - Legal & RGPD */}
          <div style={{ padding: '4px 18px', borderRadius: 22, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', marginBottom: 14 } as any}>
            <ProfileMenuItem icon="ri-shield-check-line" label="Gestion des donnees" onPress={() => { setShowRGPD(true); setRgpdSent(false); setRgpdMsg(''); }} />
            <ProfileMenuItem icon="ri-file-shield-2-line" label="Politique de confidentialite" onPress={() => setShowPrivacy(true)} />
            <ProfileMenuItem icon="ri-file-text-line" label="Conditions generales (CGU)" onPress={() => setShowCGU(true)} />
            <ProfileMenuItem icon="ri-information-line" label="Mentions legales" onPress={() => setShowMentions(true)} />
          </div>

          {/* Third card - Help & Support */}
          <div style={{ padding: '4px 18px', borderRadius: 22, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', marginBottom: 14 } as any}>
            <ProfileMenuItem icon="ri-question-line" label="Centre d'aide" onPress={() => setShowHelp(true)} />
            <ProfileMenuItem icon="ri-mail-line" label={t('support')} onPress={() => setShowContact(true)} />
            <ProfileMenuItem icon="ri-apps-line" label={`${t('about')} - Chutex v3.0`} onPress={() => Alert.alert('CHUTEX', 'Version 3.0\nChutex Innovation SAS\ncontact@chutex-innovation.com')} />
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
          <ProfileGlassPopup visible={editMode} onClose={() => setEditMode(false)}>
            <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>{t('modify_profile')}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#FFF', marginBottom: 20 }}>{user.name}</div>
            {[
              { val: editName, set: setEditName, label: 'Nom complet', icon: 'ri-user-line' },
              { val: editEmail, set: setEditEmail, label: 'Email', icon: 'ri-mail-line' },
              { val: editPhone, set: setEditPhone, label: 'Telephone', icon: 'ri-phone-line' },
              { val: editAddress, set: setEditAddress, label: 'Adresse', icon: 'ri-map-pin-line' },
              { val: editDob, set: setEditDob, label: 'Date de naissance', icon: 'ri-calendar-line', type: 'date' },
              { val: editGender, set: setEditGender, label: 'Sexe (M/F)', icon: 'ri-genderless-line' },
              { val: editHeight, set: setEditHeight, label: 'Taille (cm)', icon: 'ri-ruler-line', type: 'number' },
              { val: editWeight, set: setEditWeight, label: 'Poids (kg)', icon: 'ri-scales-3-line', type: 'number' },
              { val: editEmergencyName, set: setEditEmergencyName, label: 'Contact d\'urgence (nom)', icon: 'ri-alarm-warning-line' },
              { val: editEmergencyPhone, set: setEditEmergencyPhone, label: 'Contact d\'urgence (tel)', icon: 'ri-phone-line' },
              { val: editDoctor, set: setEditDoctor, label: 'Medecin traitant', icon: 'ri-stethoscope-line' },
            ].map((f, i) => (
              <div key={i} style={{ marginBottom: 12 } as any}>
                <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>{f.label}</div>
                <input value={f.val} onChange={(e: any) => f.set(e.target.value)} style={{ width: '100%', fontSize: 15, padding: '14px 16px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#FFF', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' } as any} />
              </div>
            ))}
            <div style={{ display: 'flex', gap: 10, marginTop: 16 } as any}>
              <div onClick={() => setEditMode(false)} style={{ flex: 1, padding: '14px', borderRadius: 999, textAlign: 'center', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', fontWeight: 700, cursor: 'pointer' } as any}>{t('cancel')}</div>
              <div onClick={saveProfile} style={{ flex: 1, padding: '14px', borderRadius: 999, textAlign: 'center', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)', color: '#FFF', fontWeight: 700, cursor: 'pointer' } as any}>{saving ? '...' : 'Enregistrer'}</div>
            </div>
          </ProfileGlassPopup>

          <ProfileGlassPopup visible={showPwChange} onClose={() => setShowPwChange(false)}>
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
          </ProfileGlassPopup>

          <ProfileGlassPopup visible={showContact} onClose={() => setShowContact(false)}>
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
          </ProfileGlassPopup>

          <ProfileGlassPopup visible={showNotifPrefs} onClose={() => setShowNotifPrefs(false)}>
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
          </ProfileGlassPopup>

          {/* CARE SUBSCRIPTION DETAIL POPUP */}
          {showCareDetail && (
            <div onClick={() => setShowCareDetail(false)} data-testid="care-detail-popup" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(88,40,200,0.15)', overflowY: 'scroll', WebkitOverflowScrolling: 'touch' } as any}>
              <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '40px 28px 120px', boxSizing: 'border-box' } as any}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}>
                  <div onClick={() => setShowCareDetail(false)} style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div>
                </div>
                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 28 } as any}>
                  <div style={{ width: 72, height: 72, borderRadius: 22, background: 'linear-gradient(135deg, rgba(124,92,255,0.3), rgba(139,92,246,0.2))', border: '1px solid rgba(124,92,255,0.4)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 } as any}>
                    <i className="ri-shield-star-line" style={{ fontSize: 36, color: '#A78BFA' }} />
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: '#FFF' }}>Abonnement Care</div>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px', borderRadius: 999, background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.3)', marginTop: 10 } as any}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981' } as any} />
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#10B981' }}>Actif</span>
                  </div>
                </div>
                {/* Details */}
                {[
                  { icon: 'ri-shield-check-line', label: 'Type', value: 'Care — Teleassistance 24/7' },
                  { icon: 'ri-phone-line', label: 'Teleassistance', value: 'Plateau d\'ecoute 24h/24, 7j/7' },
                  { icon: 'ri-first-aid-kit-line', label: 'Intervention', value: 'Intervenants Care a domicile' },
                  { icon: 'ri-map-pin-line', label: 'Suivi temps reel', value: 'Geolocalisation des intervenants' },
                  { icon: 'ri-file-text-line', label: 'Rapports', value: 'Rapports d\'intervention detailles' },
                  subData?.subscription?.created_at && { icon: 'ri-calendar-line', label: 'Souscrit le', value: new Date(subData.subscription.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) },
                  subData?.subscription?.source && { icon: 'ri-information-line', label: 'Source', value: subData.subscription.source === 'manual' ? 'Activation manuelle' : subData.subscription.source },
                ].filter(Boolean).map((item: any, i: number, arr: any[]) => (
                  <div key={i}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0' } as any}>
                      <div style={{ width: 36, height: 36, borderRadius: 12, background: 'rgba(124,92,255,0.12)', border: '1px solid rgba(124,92,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                        <i className={item.icon} style={{ fontSize: 16, color: '#A78BFA' }} />
                      </div>
                      <div style={{ flex: 1 } as any}>
                        <div style={{ fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 }}>{item.label}</div>
                        <div style={{ fontSize: 14, color: '#FFF', fontWeight: 500 }}>{item.value}</div>
                      </div>
                    </div>
                    {i < arr.length - 1 && <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' } as any} />}
                  </div>
                ))}
                {/* Included features */}
                <div style={{ marginTop: 20, padding: '16px 18px', borderRadius: 18, background: 'rgba(124,92,255,0.08)', border: '1px solid rgba(124,92,255,0.15)' } as any}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, textTransform: 'uppercase', marginBottom: 12 }}>Inclus dans votre abonnement</div>
                  {['Detection de chute automatique', 'Bouton SOS sur bracelet', 'Plateau d\'ecoute 24/7', 'Envoi d\'intervenants Care', 'Suivi GPS en temps reel', 'Notifications aux gardiens', 'Rapports de cloture'].map((f, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 } as any}>
                      <i className="ri-check-line" style={{ fontSize: 14, color: '#A78BFA' }} />
                      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.7)' }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Face ID Popup */}
          {showFaceId && Platform.OS === 'web' && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
              <div style={{ width: '100%', maxWidth: 380, padding: '32px 28px', boxSizing: 'border-box' } as any}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 } as any}>
                  <div onClick={() => setShowFaceId(false)} style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div>
                </div>
                <div style={{ textAlign: 'center' } as any}>
                  <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 } as any}>
                    <i className="ri-fingerprint-line" style={{ fontSize: 32, color: '#A78BFA' }} />
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', marginBottom: 8 }}>Face ID / Biometrie</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6, marginBottom: 20 }}>L'authentification biometrique est disponible sur l'application mobile iOS et Android.</div>
                  <div style={{ padding: '14px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'left', marginBottom: 16 } as any}>
                    {['Installez l\'app via TestFlight', 'Connectez-vous une premiere fois', 'Activez Face ID dans ce menu'].map((s, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none' } as any}>
                        <div style={{ width: 24, height: 24, borderRadius: 999, background: 'rgba(167,139,250,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}><span style={{ fontSize: 12, fontWeight: 800, color: '#A78BFA' }}>{i + 1}</span></div>
                        <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>{s}</span>
                      </div>
                    ))}
                  </div>
                  <div onClick={() => setShowFaceId(false)} style={{ padding: '14px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#FFF' } as any}>Compris</div>
                </div>
              </div>
            </div>
          )}

          {/* Medical Record Popup */}
          {showMedical && Platform.OS === 'web' && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.2)', overflowY: 'scroll', WebkitOverflowScrolling: 'touch' } as any}>
              <div style={{ width: '100%', maxWidth: 400, margin: '0 auto', padding: '40px 28px 120px', boxSizing: 'border-box' } as any}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}>
                  <div onClick={() => setShowMedical(false)} style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div>
                </div>
                <div style={{ textAlign: 'center', marginBottom: 24 } as any}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 } as any}>
                    <i className="ri-heart-pulse-line" style={{ fontSize: 28, color: '#EF4444' }} />
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF' }}>Dossier medical</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>Modifiez vos informations medicales</div>
                </div>

                {/* Blood type */}
                <div style={{ marginBottom: 14 } as any}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 }}>Groupe sanguin</div>
                  <select value={medForm.blood_type} onChange={(e: any) => setMedForm({ ...medForm, blood_type: e.target.value })} style={{ width: '100%', padding: '13px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 14, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', appearance: 'none', cursor: 'pointer', colorScheme: 'dark' } as any}>
                    <option value="" style={{ background: '#0a0f1a' }}>Selectionner</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Je ne sais pas'].map(bt => <option key={bt} value={bt} style={{ background: '#0a0f1a' }}>{bt}</option>)}
                  </select>
                </div>

                {/* Pathologies */}
                <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Pathologies</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 14 } as any}>
                  {['Diabete', 'Hypertension', 'Cholesterol', 'Arthrose', 'Insuffisance cardiaque', 'AVC', 'Asthme', 'Osteoporose', 'Parkinson', 'Alzheimer', 'Depression', 'Hemophilie', 'Epilepsie', 'Aucune'].map(c => (
                    <div key={c} onClick={() => { if (c === 'Aucune') setMedForm({ ...medForm, conditions: ['Aucune'] }); else setMedForm({ ...medForm, conditions: medForm.conditions.includes(c) ? medForm.conditions.filter(x => x !== c) : [...medForm.conditions.filter(x => x !== 'Aucune'), c] }); }} style={{ padding: '10px 12px', borderRadius: 12, background: medForm.conditions.includes(c) ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${medForm.conditions.includes(c) ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 } as any}>
                      <div style={{ width: 18, height: 18, borderRadius: 5, background: medForm.conditions.includes(c) ? '#10B981' : 'rgba(255,255,255,0.06)', border: `1px solid ${medForm.conditions.includes(c) ? '#10B981' : 'rgba(255,255,255,0.15)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                        {medForm.conditions.includes(c) && <i className="ri-check-line" style={{ fontSize: 11, color: '#FFF' }} />}
                      </div>
                      <span style={{ fontSize: 12, color: medForm.conditions.includes(c) ? '#FFF' : 'rgba(255,255,255,0.35)' }}>{c}</span>
                    </div>
                  ))}
                </div>

                {/* Allergies */}
                <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Allergies</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 14 } as any}>
                  {['Penicilline', 'Aspirine', 'Latex', 'Arachides', 'Gluten', 'Lactose', 'Iode', 'Aucune'].map(a => (
                    <div key={a} onClick={() => { if (a === 'Aucune') setMedForm({ ...medForm, allergies: ['Aucune'] }); else setMedForm({ ...medForm, allergies: medForm.allergies.includes(a) ? medForm.allergies.filter(x => x !== a) : [...medForm.allergies.filter(x => x !== 'Aucune'), a] }); }} style={{ padding: '10px 12px', borderRadius: 12, background: medForm.allergies.includes(a) ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${medForm.allergies.includes(a) ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 } as any}>
                      <div style={{ width: 18, height: 18, borderRadius: 5, background: medForm.allergies.includes(a) ? '#10B981' : 'rgba(255,255,255,0.06)', border: `1px solid ${medForm.allergies.includes(a) ? '#10B981' : 'rgba(255,255,255,0.15)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                        {medForm.allergies.includes(a) && <i className="ri-check-line" style={{ fontSize: 11, color: '#FFF' }} />}
                      </div>
                      <span style={{ fontSize: 12, color: medForm.allergies.includes(a) ? '#FFF' : 'rgba(255,255,255,0.35)' }}>{a}</span>
                    </div>
                  ))}
                </div>

                {/* Pacemaker / Stents / Thyroid */}
                {[
                  { key: 'pacemaker', label: 'Portez-vous un pacemaker ?' },
                  { key: 'stents', label: 'Avez-vous des stents ?' },
                  { key: 'thyroid', label: 'Probleme de thyroide ?' },
                ].map(q => (
                  <div key={q.key} style={{ marginBottom: 14 } as any}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF', marginBottom: 8 }}>{q.label}</div>
                    <div style={{ display: 'flex', gap: 8 } as any}>
                      {['oui', 'non'].map(v => (
                        <div key={v} onClick={() => setMedForm({ ...medForm, [q.key]: v })} style={{ flex: 1, padding: '12px', borderRadius: 14, background: (medForm as any)[q.key] === v ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${(medForm as any)[q.key] === v ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', textAlign: 'center', fontSize: 13, fontWeight: 700, color: (medForm as any)[q.key] === v ? '#FFF' : 'rgba(255,255,255,0.35)' } as any}>{v === 'oui' ? 'Oui' : 'Non'}</div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Surgeries */}
                <div style={{ fontSize: 13, fontWeight: 700, color: '#FFF', marginBottom: 8, marginTop: 4 }}>Operations chirurgicales</div>
                {(medForm.surgeries || []).map((s: any, idx: number) => (
                  <div key={idx} style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 8 } as any}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 } as any}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#FFF' }}>Operation {idx + 1}</span>
                      <div onClick={() => setMedForm({ ...medForm, surgeries: (medForm.surgeries || []).filter((_: any, i: number) => i !== idx) })} style={{ cursor: 'pointer', fontSize: 11, color: '#EF4444', fontWeight: 700 } as any}>Supprimer</div>
                    </div>
                    <input placeholder="Zone operee (ex: genou droit)" value={s.zone} onChange={(e: any) => { const arr = [...(medForm.surgeries || [])]; arr[idx] = { ...arr[idx], zone: e.target.value }; setMedForm({ ...medForm, surgeries: arr }); }}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', marginBottom: 6 } as any} />
                    <input placeholder="Date (ex: Mars 2022)" value={s.date} onChange={(e: any) => { const arr = [...(medForm.surgeries || [])]; arr[idx] = { ...arr[idx], date: e.target.value }; setMedForm({ ...medForm, surgeries: arr }); }}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' } as any} />
                  </div>
                ))}
                <div onClick={() => setMedForm({ ...medForm, surgeries: [...(medForm.surgeries || []), { zone: '', date: '' }] })} style={{ padding: '12px', borderRadius: 999, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 14 } as any}>
                  <i className="ri-add-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>Ajouter une operation</span>
                </div>

                {/* Save */}
                {medSaved && <div style={{ padding: '10px 14px', borderRadius: 999, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 } as any}><i className="ri-checkbox-circle-line" style={{ fontSize: 16, color: '#10B981' }} /><span style={{ fontSize: 13, fontWeight: 700, color: '#10B981' }}>Sauvegarde !</span></div>}
                <div onClick={async () => {
                  setMedSaving(true);
                  try {
                    await apiFetch('/api/auth/update-profile', { method: 'PUT', body: JSON.stringify({
                      blood_type: medForm.blood_type, medical_conditions: medForm.conditions.join(', '),
                      allergies: medForm.allergies.join(', '), pacemaker: medForm.pacemaker,
                      stents: medForm.stents, thyroid: medForm.thyroid,
                    }) }, token);
                    setMedSaved(true); setTimeout(() => setMedSaved(false), 3000);
                  } catch {} finally { setMedSaving(false); }
                }} style={{ padding: '16px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer', textAlign: 'center', fontSize: 14, fontWeight: 700, color: '#FFF', opacity: medSaving ? 0.6 : 1 } as any}>{medSaving ? 'Sauvegarde...' : 'Sauvegarder'}</div>
              </div>
            </div>
          )}

          <HelpCenter visible={showHelp} onClose={() => setShowHelp(false)} role={user?.active_role || user?.role} />

          {/* RGPD - Gestion des donnees */}
          {showRGPD && (
            <ProfileGlassPopup visible={showRGPD} onClose={() => setShowRGPD(false)}>
              <div style={{ textAlign: 'center', marginBottom: 24 } as any}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 } as any}>
                  <i className="ri-shield-check-line" style={{ fontSize: 28, color: '#38BDF8' }} />
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>Gestion des donnees</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>Exercez vos droits RGPD</div>
              </div>
              {!rgpdSent ? (
                <>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>Type de demande</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 } as any}>
                    {[
                      { key: 'access', label: "Droit d'acces", desc: 'Obtenir une copie de vos donnees personnelles', icon: 'ri-eye-line' },
                      { key: 'deletion', label: 'Droit a la suppression', desc: 'Demander l\'effacement de vos donnees', icon: 'ri-delete-bin-line' },
                      { key: 'opposition', label: "Droit d'opposition", desc: 'Vous opposer au traitement de vos donnees', icon: 'ri-hand-heart-line' },
                      { key: 'portability', label: 'Droit a la portabilite', desc: 'Recevoir vos donnees dans un format structure', icon: 'ri-download-2-line' },
                    ].map(r => (
                      <div key={r.key} data-testid={`rgpd-right-${r.key}`} onClick={() => setRgpdRight(r.key)} style={{ padding: '14px 16px', borderRadius: 14, background: rgpdRight === r.key ? 'rgba(56,189,248,0.1)' : 'rgba(255,255,255,0.03)', border: `1px solid ${rgpdRight === r.key ? 'rgba(56,189,248,0.3)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 } as any}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: rgpdRight === r.key ? 'rgba(56,189,248,0.15)' : 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 } as any}>
                          <i className={r.icon} style={{ fontSize: 16, color: rgpdRight === r.key ? '#38BDF8' : 'rgba(255,255,255,0.3)' }} />
                        </div>
                        <div style={{ flex: 1 } as any}>
                          <div style={{ fontSize: 14, fontWeight: 700, color: rgpdRight === r.key ? '#FFF' : 'rgba(255,255,255,0.5)' }}>{r.label}</div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>{r.desc}</div>
                        </div>
                        {rgpdRight === r.key && <i className="ri-check-line" style={{ fontSize: 16, color: '#38BDF8' }} />}
                      </div>
                    ))}
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 6 }}>Message complementaire (optionnel)</div>
                  <textarea value={rgpdMsg} onChange={(e: any) => setRgpdMsg(e.target.value)} placeholder="Precisions sur votre demande..." rows={3} style={{ width: '100%', padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 13, fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box', outline: 'none', marginBottom: 12 } as any} />
                  <div style={{ padding: '10px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 16 } as any}>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', lineHeight: 1.6 }}>
                      Votre demande sera envoyee a <strong style={{ color: 'rgba(255,255,255,0.5)' }}>contact@chutex-innovation.com</strong> avec l'objet : <strong style={{ color: 'rgba(255,255,255,0.5)' }}>RGPD - {{'access': "Droit d'acces", 'deletion': 'Droit a la suppression', 'opposition': "Droit d'opposition", 'portability': 'Droit a la portabilite'}[rgpdRight]}</strong>. Delai legal de reponse : 30 jours maximum.
                    </div>
                  </div>
                  <div data-testid="rgpd-submit-btn" onClick={async () => {
                    setRgpdSending(true);
                    try {
                      const res = await apiFetch('/api/rgpd/request', { method: 'POST', body: JSON.stringify({ right_type: rgpdRight, message: rgpdMsg }) }, token);
                      setRgpdRef(res.request_id || '');
                      setRgpdSent(true);
                    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setRgpdSending(false); }
                  }} style={{ padding: '16px', borderRadius: 999, background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.25)', cursor: rgpdSending ? 'wait' : 'pointer', textAlign: 'center', fontSize: 15, fontWeight: 800, color: '#38BDF8' } as any}>
                    {rgpdSending ? 'Envoi en cours...' : 'Envoyer ma demande'}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center' } as any}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 } as any}>
                    <i className="ri-check-double-line" style={{ fontSize: 28, color: '#10B981' }} />
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 900, color: '#FFF', marginBottom: 8 }}>Demande envoyee</div>
                  <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 1.6, marginBottom: 16 }}>
                    Votre demande a ete enregistree sous la reference <strong style={{ color: '#38BDF8' }}>{rgpdRef}</strong>. Nous vous repondrons sous 30 jours maximum conformement au RGPD.
                  </div>
                  <div onClick={() => setShowRGPD(false)} style={{ padding: '14px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#FFF' } as any}>Fermer</div>
                </div>
              )}
            </ProfileGlassPopup>
          )}

          {/* Politique de confidentialite */}
          {showPrivacy && (
            <ProfileGlassPopup visible={showPrivacy} onClose={() => setShowPrivacy(false)}>
              <div style={{ textAlign: 'center', marginBottom: 20 } as any}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 } as any}>
                  <i className="ri-file-shield-2-line" style={{ fontSize: 28, color: '#A78BFA' }} />
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>Politique de confidentialite</div>
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, whiteSpace: 'pre-wrap' } as any}>
                {`POLITIQUE DE CONFIDENTIALITE - CARE WATCH\n\nDerniere mise a jour : Fevrier 2026\n\n1. RESPONSABLE DU TRAITEMENT\nChutex Innovation SAS\nEmail DPO : contact@chutex-innovation.com\n\n2. DONNEES COLLECTEES\n- Donnees d'identification : nom, prenom, email, telephone\n- Donnees de sante (Art. 9 RGPD) : frequence cardiaque, tension, SpO2, temperature, poids, sommeil, ECG\n- Donnees de geolocalisation : position GPS\n- Donnees de connexion : logs, adresse IP\n\n3. FINALITES\n- Suivi de sante preventif et personnalise\n- Detection d'anomalies et alertes\n- Teleassistance et envoi d'intervenants\n- Analyse IA (assistant Nora)\n\n4. BASE LEGALE\n- Consentement explicite (Art. 6.1.a et Art. 9.2.a)\n- Execution du contrat (Art. 6.1.b)\n\n5. DUREE DE CONSERVATION\n- Donnees de sante : 5 ans apres derniere utilisation\n- Donnees de compte : duree du contrat + 3 ans\n- Logs : 12 mois\n\n6. DESTINATAIRES\n- Equipe Chutex Innovation\n- Gardiens/prescripteurs designes\n- Plateaux d'ecoute\n- Aucune vente a des tiers\n\n7. VOS DROITS (Art. 15 a 22 RGPD)\nAcces, rectification, effacement, opposition, portabilite, retrait du consentement.\nContact : contact@chutex-innovation.com\nDelai : 30 jours maximum.\n\n8. SECURITE\nChiffrement, controle d'acces, pseudonymisation.\n\n9. RECLAMATION CNIL\nwww.cnil.fr`}
              </div>
            </ProfileGlassPopup>
          )}

          {/* CGU */}
          {showCGU && (
            <ProfileGlassPopup visible={showCGU} onClose={() => setShowCGU(false)}>
              <div style={{ textAlign: 'center', marginBottom: 20 } as any}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 } as any}>
                  <i className="ri-file-text-line" style={{ fontSize: 28, color: '#F59E0B' }} />
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>Conditions generales</div>
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, whiteSpace: 'pre-wrap' } as any}>
                {`CONDITIONS GENERALES D'UTILISATION - CARE WATCH\n\nDerniere mise a jour : Fevrier 2026\n\n1. OBJET\nLes presentes CGU regissent l'utilisation de l'application CARE WATCH editee par Chutex Innovation SAS.\n\n2. DESCRIPTION DU SERVICE\nCARE WATCH est une application de teleassistance et de suivi de sante preventif : suivi des constantes vitales, detection de chutes, assistance 24/7, recommandations IA.\n\n3. INSCRIPTION\nL'utilisateur fournit des informations exactes et est responsable de la confidentialite de ses identifiants.\n\n4. DONNEES DE SANTE\nL'utilisateur consent explicitement au traitement de ses donnees de sante. Ce consentement peut etre retire a tout moment.\n\n5. RESPONSABILITES\nCARE WATCH est un outil d'aide, pas un substitut medical. Les recommandations IA sont informatives.\n\n6. PROPRIETE INTELLECTUELLE\nL'application est la propriete de Chutex Innovation SAS.\n\n7. RESILIATION\nSuppression du compte possible a tout moment.\n\n8. LOI APPLICABLE\nDroit francais. Competence des tribunaux francais.`}
              </div>
            </ProfileGlassPopup>
          )}

          {/* Mentions legales */}
          {showMentions && (
            <ProfileGlassPopup visible={showMentions} onClose={() => setShowMentions(false)}>
              <div style={{ textAlign: 'center', marginBottom: 20 } as any}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 } as any}>
                  <i className="ri-information-line" style={{ fontSize: 28, color: 'rgba(255,255,255,0.6)' }} />
                </div>
                <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>Mentions legales</div>
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, whiteSpace: 'pre-wrap' } as any}>
                {`MENTIONS LEGALES\n\nEDITEUR\nChutex Innovation SAS\nEmail : contact@chutex-innovation.com\nDirecteur de la publication : Chutex Innovation\n\nHEBERGEMENT\nServeurs securises en Europe.\n\nPROPRIETE INTELLECTUELLE\nL'ensemble du contenu de CARE WATCH est protege par le droit de la propriete intellectuelle.\n\nDONNEES PERSONNELLES\nConformement au RGPD et a la loi Informatique et Libertes, vous disposez de droits sur vos donnees. Consultez notre Politique de confidentialite.\n\nCONTACT DPO\ncontact@chutex-innovation.com\n\nRECLAMATION CNIL\nCommission Nationale de l'Informatique et des Libertes\n3 Place de Fontenoy, 75334 Paris\nwww.cnil.fr`}
              </div>
            </ProfileGlassPopup>
          )}

          {/* Language popup glass */}
          {showLangPicker && (
            <div onClick={() => setShowLangPicker(false)} style={{ position: 'fixed', inset: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.4)', overflowY: 'auto' } as any}>
              <div onClick={(e: any) => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, margin: '0 auto', padding: '40px 24px 120px', boxSizing: 'border-box' } as any}>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}><div onClick={() => setShowLangPicker(false)} style={{ width: 36, height: 36, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div></div>
                <div style={{ textAlign: 'center', marginBottom: 28 } as any}>
                  <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 } as any}><i className="ri-global-line" style={{ fontSize: 26, color: 'rgba(255,255,255,0.6)' }} /></div>
                  <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF' }}>{t('language')}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 } as any}>
                  {[
                    { code: 'FR', flag: '\u{1F1EB}\u{1F1F7}', name: 'Francais' },
                    { code: 'EN', flag: '\u{1F1EC}\u{1F1E7}', name: 'English' },
                    { code: 'DE', flag: '\u{1F1E9}\u{1F1EA}', name: 'Deutsch' },
                    { code: 'ES', flag: '\u{1F1EA}\u{1F1F8}', name: 'Espanol' },
                    { code: 'IT', flag: '\u{1F1EE}\u{1F1F9}', name: 'Italiano' },
                    { code: 'PT', flag: '\u{1F1F5}\u{1F1F9}', name: 'Portugues' },
                    { code: 'NL', flag: '\u{1F1F3}\u{1F1F1}', name: 'Nederlands' },
                  ].map(l => (
                    <div key={l.code} onClick={() => { setLang(l.code); setShowLangPicker(false); }} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 18px', borderRadius: 18, cursor: 'pointer', background: lang === l.code ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.02)', border: lang === l.code ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.05)' } as any}>
                      <span style={{ fontSize: 32, lineHeight: 1 }}>{l.flag}</span>
                      <span style={{ fontSize: 15, fontWeight: lang === l.code ? 800 : 500, color: lang === l.code ? '#FFF' : 'rgba(255,255,255,0.45)', flex: 1 }}>{l.name}</span>
                      {lang === l.code && <i className="ri-check-line" style={{ fontSize: 18, color: '#22D3EE' }} />}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
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
          <ProfileMenuItem icon="person-outline" label={t('modify_profile')} onPress={() => setEditMode(true)} />
          <ProfileMenuItem icon="lock-closed-outline" label={t('security')} onPress={() => setShowPwChange(true)} />
          <ProfileMenuItem icon="notifications-outline" label="Notifications" onPress={() => { setShowNotifPrefs(true); fetchNotifPrefs(); }} />
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