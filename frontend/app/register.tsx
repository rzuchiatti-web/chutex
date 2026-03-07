import React, { useState, useEffect } from 'react';
import { View, Text, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from '../src/services/api';
import { useAuth } from '../src/context/AuthContext';
import { useI18n } from '../src/context/I18nContext';
import { RegisterForm } from '../src/components/register/RegisterUI';
import LanguagePicker from '../src/components/LanguagePicker';
import RoleSelection from '../src/components/register/RoleSelection';
import RGPDStep from '../src/components/register/RGPDStep';
import PhonePasswordStep from '../src/components/register/PhonePasswordStep';
import VerifyPhoneStep from '../src/components/register/VerifyPhoneStep';
import SAADStep from '../src/components/register/SAADStep';
import BeneficiaryInfoStep from '../src/components/register/BeneficiaryInfoStep';
import MedicalStep from '../src/components/register/MedicalStep';
import AntecedentsStep from '../src/components/register/AntecedentsStep';
import GuardianInfoStep from '../src/components/register/GuardianInfoStep';
import NoraPresentationStep from '../src/components/register/NoraPresentationStep';
import NativePageView from '../src/components/NativePageView';

// Steps: 0=role, 1=RGPD, 2=phone/pass (or SAAD form), 3=SMS verify, 4+=info steps
// Beneficiary: 0,1,2,3,4(info),5(medical),6(antecedents) = 6 steps
// Guardian: 0,1,2,3,4(info) = 4 steps
// SAAD: 0,1,2(form),3(verify) = 3 steps
const BEN_STEPS = 6;
const GUARD_STEPS = 4;
const SAAD_STEPS = 3;

export default function RegisterScreen() {
  const router = useRouter();
  const { login, token } = useAuth();
  const { t, lang, setLang } = useI18n();
  const [role, setRole] = useState('');
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [showBiometric, setShowBiometric] = useState(false);
  const [showNora, setShowNora] = useState(false);

  useEffect(() => { AsyncStorage.getItem('chutex_lang').then(v => { if (v) setLang(v); }).catch(() => {}); }, []);
  const [form, setForm] = useState<RegisterForm>({
    phone: '', prefix: '+33', password: '', confirmPassword: '',
    name: '', firstName: '', dob_day: '', dob_month: '', dob_year: '', gender: '', address: '', postal_code: '', city: '', country: 'France',
    height_cm: '', weight_kg: '', blood_type: '', thyroid: '',
    pacemaker: '', stents: '', had_avc: '',
    allergies: [], medical_conditions: [], other_condition: '',
    doctor_name: '', doctor_phone: '', social_security: '',
    devices: '',
    had_surgery: '', surgeries: [],
    family_history: [], how_found: '',
    pro_type: '', structure: '', alert_sms: false, alert_email: false,
    acceptTerms: false,
    structure_name: '', siret: '', saad_address: '', saad_postal_code: '', saad_city: '', saad_country: 'France', saad_director_name: '', saad_director_phone: '', saad_email: '', invite_token: '',
  });
  const u = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  const toggleArr = (k: string, v: string) => setForm(f => {
    const arr = (f as any)[k] as string[];
    return { ...f, [k]: arr.includes(v) ? arr.filter(x => x !== v) : [...arr, v] };
  });

  const totalSteps = role === 'beneficiary' ? BEN_STEPS : role === 'prescriber_company' ? SAAD_STEPS : GUARD_STEPS;

  const getFullPhone = () => {
    let ph = form.phone.trim().replace(/\s/g, '');
    if (ph.startsWith('0') && ph.length >= 9) ph = form.prefix + ph.substring(1);
    else if (!ph.startsWith('+')) ph = form.prefix + ph;
    return ph;
  };

  const canNext = () => {
    if (step === 0) return !!role;
    if (step === 1) return true; // RGPD info
    if (step === 3) return phoneVerified; // SMS verify - auto-advances
    if (role === 'prescriber_company') {
      if (step === 2) return form.structure_name.trim() && form.siret.trim() && form.saad_director_name.trim() && form.phone.trim().length >= 6 && form.password.length >= 6 && form.password === form.confirmPassword && form.acceptTerms;
      return true;
    }
    if (step === 2) return form.phone.trim().length >= 6 && form.password.length >= 6 && form.password === form.confirmPassword;
    if (step === 4 && role === 'beneficiary') return form.name.trim() && form.firstName.trim() && form.gender && form.dob_day && form.dob_month && form.dob_year && form.height_cm && form.weight_kg;
    if (step === 4 && role === 'guardian') return form.name.trim() && form.firstName.trim() && form.acceptTerms;
    if (step === 5 && role === 'beneficiary') return !!form.blood_type && form.medical_conditions.length > 0 && form.allergies.length > 0 && !!form.pacemaker && !!form.stents && !!form.thyroid;
    if (step === 6 && role === 'beneficiary') return !!form.had_surgery && form.family_history.length > 0 && form.acceptTerms;
    return true;
  };

  const handleRegister = async () => {
    setSubmitting(true); setError('');
    try {
      const ph = getFullPhone();
      const body: any = {
        email: role === 'prescriber_company' ? form.saad_email || ph : ph,
        password: form.password, name: role === 'prescriber_company' ? form.saad_director_name : `${form.firstName} ${form.name}`.trim(),
        phone: ph, role: role,
      };
      if (role === 'prescriber_company') {
        body.structure_name = form.structure_name;
        body.siret = form.siret;
        body.address = [form.saad_address, form.saad_postal_code, form.saad_city, form.saad_country].filter(Boolean).join(', ');
        body.postal_code = form.saad_postal_code;
        body.city = form.saad_city;
        body.country = form.saad_country;
        body.is_prescriber = true;
        body.prescriber_structure = form.structure_name;
        if (form.invite_token) body.invite_token = form.invite_token;
      } else {
        body.date_of_birth = form.dob_year && form.dob_month && form.dob_day ? `${form.dob_year}-${form.dob_month.padStart(2,'0')}-${form.dob_day.padStart(2,'0')}` : '';
        body.gender = form.gender;
        body.address = form.address;
        body.postal_code = form.postal_code;
        body.city = form.city;
        body.country = form.country;
        body.height_cm = form.height_cm ? parseFloat(form.height_cm) : null;
        body.weight_kg = form.weight_kg ? parseFloat(form.weight_kg) : null;
        body.blood_type = form.blood_type;
        body.allergies = form.allergies.join(', ');
        body.medical_conditions = form.medical_conditions.join(', ');
      }
      await apiFetch('/api/auth/register', { method: 'POST', body: JSON.stringify(body) });
      await login(ph, form.password);
      setShowNora(true);
    } catch (e: any) { setError(e.message || 'Erreur'); } finally { setSubmitting(false); }
  };

  const enableBiometric = async () => {
    try {
      await AsyncStorage.setItem('biometric_enabled', 'true');
      await AsyncStorage.setItem('biometric_phone', getFullPhone());
      await AsyncStorage.setItem('biometric_password', form.password);
    } catch {}
    router.replace('/(tabs)');
  };

  const isLastStep = (role === 'beneficiary' && step === BEN_STEPS) || (role === 'guardian' && step === GUARD_STEPS) || (role === 'prescriber_company' && step === SAAD_STEPS);
  const isVerifyStep = step === 3;

  // After phone verification (step 3 → 4), check for contract pre-fill
  useEffect(() => {
    if (step === 4 && role === 'beneficiary' && phoneVerified) {
      const ph = getFullPhone();
      apiFetch(`/api/auth/contract-prefill/${encodeURIComponent(ph)}`).then((res: any) => {
        if (res?.has_contract && res?.prefill) {
          const pf = res.prefill;
          setForm((prev: any) => ({
            ...prev,
            firstName: pf.first_name || prev.firstName,
            name: pf.last_name || prev.name,
            gender: pf.gender || prev.gender,
            address: pf.address || prev.address,
            city: pf.city || prev.city,
            postal_code: pf.postal_code || prev.postal_code,
            ...(pf.date_of_birth ? (() => {
              const parts = pf.date_of_birth.split('-');
              return parts.length === 3 ? { dob_year: parts[0], dob_month: parts[1], dob_day: parts[2] } : {};
            })() : {}),
          }));
        }
      }).catch(() => {});
    }
  }, [step, phoneVerified]);

  if (Platform.OS !== 'web') return <NativePageView path="/register" />;

  if (showNora) {
    const userName = role === 'prescriber_company' ? form.saad_director_name : `${form.firstName} ${form.name}`.trim();
    return <NoraPresentationStep role={role} userName={userName} onContinue={() => {
      if (typeof sessionStorage !== 'undefined') sessionStorage.setItem('briefing_seen', '1');
      // Mark Nora welcome as seen so next login shows morning briefing
      apiFetch('/api/auth/update-profile', { method: 'PUT', body: JSON.stringify({ nora_welcome_seen: true }) }, token).catch(() => {});
      if (Platform.OS !== 'web') { setShowNora(false); setShowBiometric(true); }
      else router.replace('/(tabs)');
    }} />;
  }

  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', fontFamily: "'Inter', system-ui, sans-serif", overflow: 'hidden' } as any}>
      <div style={{ position: 'absolute', inset: 0, zIndex: 0, backgroundImage: 'url(https://cdn.shopify.com/s/files/1/0886/1918/8558/files/banner_login_mobile.jpg?v=1771242072)', backgroundSize: 'cover', backgroundPosition: 'center 30%' } as any} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 100%)', zIndex: 1 } as any} />

      <div style={{ flex: 1, overflowY: 'auto', position: 'relative', zIndex: 5, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 24px 100px' } as any}>
        <div style={{ width: '100%', maxWidth: 400 } as any}>

          {step > 0 && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 24 } as any}>
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div key={i} style={{ flex: 1, height: 4, borderRadius: 2, background: i < step ? '#FFF' : 'rgba(255,255,255,0.1)' } as any} />
              ))}
            </div>
          )}

          {step === 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 } as any}>
              <div data-testid="register-back-btn" onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', cursor: 'pointer' } as any}>
                <i className="ri-arrow-left-line" style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Connexion</span>
              </div>
              <LanguagePicker lang={lang} setLang={setLang} />
            </div>
          )}

          {step > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 } as any}>
              <div data-testid="register-back-btn" onClick={() => { if (step > 1) setStep(step - 1); else setStep(0); }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', cursor: 'pointer' } as any}>
                <i className="ri-arrow-left-line" style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }} />
                <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.5)' }}>Retour</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 } as any}>
                <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>{t('step_info')} {step}/{totalSteps}</span>
                <LanguagePicker lang={lang} setLang={setLang} />
              </div>
            </div>
          )}

          {error && <div style={{ padding: '12px 16px', borderRadius: 14, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', marginBottom: 16, fontSize: 13, color: '#F87171' } as any}>{error}</div>}

          {step === 0 && <RoleSelection onSelect={(r) => { setRole(r); setStep(1); }} />}
          {step === 1 && <RGPDStep />}
          {step === 2 && role === 'prescriber_company' && <SAADStep form={form} u={u} />}
          {step === 2 && role !== 'prescriber_company' && <PhonePasswordStep form={form} u={u} />}
          {step === 3 && <VerifyPhoneStep phone={getFullPhone()} onVerified={() => { setPhoneVerified(true); if (role === 'prescriber_company') handleRegister(); else setStep(4); }} />}
          {step === 4 && role === 'beneficiary' && <BeneficiaryInfoStep form={form} u={u} />}
          {step === 5 && role === 'beneficiary' && <MedicalStep form={form} u={u} toggleArr={toggleArr} />}
          {step === 6 && role === 'beneficiary' && <AntecedentsStep form={form} u={u} toggleArr={toggleArr} />}
          {step === 4 && role === 'guardian' && <GuardianInfoStep form={form} u={u} />}

          {step > 0 && !isVerifyStep && (
            <div style={{ marginTop: 24 } as any}>
              <div data-testid="register-next-btn" onClick={() => { if (!canNext()) return; setError(''); if (isLastStep) handleRegister(); else setStep(step + 1); }} style={{ padding: '16px', borderRadius: 999, background: canNext() ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.15)', border: `1px solid ${canNext() ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'}`, backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)', cursor: canNext() ? 'pointer' : 'not-allowed', textAlign: 'center', fontSize: 15, fontWeight: 800, color: canNext() ? '#FFF' : 'rgba(255,255,255,0.25)', opacity: submitting ? 0.6 : 1 } as any}>
                {submitting ? t('connecting') : isLastStep ? t('create_account') : t('next')}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Biometric Prompt Modal */}
      {showBiometric && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 } as any}>
          <div style={{ width: '100%', maxWidth: 360, borderRadius: 24, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', padding: '32px 24px', textAlign: 'center' } as any}>
            <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' } as any}>
              <i className="ri-fingerprint-line" style={{ fontSize: 32, color: '#10B981' }} />
            </div>
            <div style={{ fontSize: 20, fontWeight: 900, color: '#FFF', marginBottom: 8 }}>Connexion biometrique</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.6, marginBottom: 24 }}>Activez Face ID ou l'empreinte digitale pour vous connecter plus rapidement la prochaine fois.</div>
            <div data-testid="enable-biometric-btn" onClick={enableBiometric} style={{ padding: '14px', borderRadius: 999, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.25)', cursor: 'pointer', fontSize: 14, fontWeight: 700, color: '#10B981', marginBottom: 10 } as any}>Activer</div>
            <div data-testid="skip-biometric-btn" onClick={() => router.replace('/(tabs)')} style={{ padding: '12px', cursor: 'pointer', fontSize: 13, color: 'rgba(255,255,255,0.35)' } as any}>Plus tard</div>
          </div>
        </div>
      )}
    </div>
  );
}
