import React from 'react';
import { GI, INPUT_STYLE, RegisterForm, UpdateFn } from './RegisterUI';
import { PrefixPicker } from '../GlassPickers';
import { useI18n } from '../../context/I18nContext';

export default function PhonePasswordStep({ form, u }: { form: RegisterForm; u: UpdateFn }) {
  const { t } = useI18n();
  return (
    <>
      <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', marginBottom: 6 }}>{t('create_your_account')}</div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>{t('your_phone')}</div>
      <div style={{ marginBottom: 14 } as any}>
        <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 }}>{t('step_phone')}</div>
        <div style={{ display: 'flex', alignItems: 'center', borderRadius: 999, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' } as any}>
          <div style={{ borderRight: '1px solid rgba(255,255,255,0.08)' } as any}>
            <PrefixPicker value={form.prefix} onChange={(code) => u('prefix', code)} />
          </div>
          <input data-testid="register-phone" type="tel" placeholder="06 12 34 56 78" value={form.phone} onChange={(e: any) => u('phone', e.target.value)} style={{ flex: 1, padding: '13px 16px', background: 'transparent', border: 'none', color: '#FFF', fontSize: 14, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' } as any} />
        </div>
      </div>
      <GI label={t('password')} type="password" placeholder="Min. 6" value={form.password} onChange={(e: any) => u('password', e.target.value)} />
      <GI label={t('confirm_password')} type="password" placeholder="" value={form.confirmPassword} onChange={(e: any) => u('confirmPassword', e.target.value)} />
      {form.password && form.confirmPassword && form.password !== form.confirmPassword && <div style={{ fontSize: 12, color: '#F87171', marginTop: -8, marginBottom: 8 }}>!</div>}
    </>
  );
}
