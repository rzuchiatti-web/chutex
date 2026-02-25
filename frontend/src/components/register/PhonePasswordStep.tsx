import React, { useState } from 'react';
import { GI, INPUT_STYLE, PREFIXES, RegisterForm, UpdateFn } from './RegisterUI';

export default function PhonePasswordStep({ form, u }: { form: RegisterForm; u: UpdateFn }) {
  const [showPrefix, setShowPrefix] = useState(false);

  return (
    <>
      <div style={{ fontSize: 24, fontWeight: 900, color: '#FFF', marginBottom: 6 }}>Creez votre compte</div>
      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 24 }}>Vos identifiants de connexion</div>
      <div style={{ marginBottom: 14 } as any}>
        <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 }}>Telephone</div>
        <div style={{ display: 'flex', gap: 8 } as any}>
          <div onClick={() => setShowPrefix(!showPrefix)} style={{ padding: '13px 12px', borderRadius: 14, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, minWidth: 90 } as any}>
            <span style={{ fontSize: 13, color: '#FFF', fontWeight: 600 }}>{form.prefix}</span>
            <i className="ri-arrow-down-s-line" style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }} />
          </div>
          <input data-testid="register-phone" type="tel" placeholder="06 12 34 56 78" value={form.phone} onChange={(e: any) => u('phone', e.target.value)} style={INPUT_STYLE} />
        </div>
        {showPrefix && (
          <div style={{ marginTop: 8, padding: '8px', borderRadius: 14, background: 'rgba(10,15,25,0.95)', border: '1px solid rgba(255,255,255,0.1)', maxHeight: 180, overflowY: 'auto' } as any}>
            {PREFIXES.map((p: any) => (
              <div key={p.code} onClick={() => { u('prefix', p.code); setShowPrefix(false); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', background: form.prefix === p.code ? 'rgba(255,255,255,0.06)' : 'transparent' } as any}>
                <span style={{ fontSize: 16 }}>{p.flag}</span>
                <span style={{ fontSize: 13, color: '#FFF', flex: 1 }}>{p.label}</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{p.code}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <GI label="Mot de passe" type="password" placeholder="Minimum 6 caracteres" value={form.password} onChange={(e: any) => u('password', e.target.value)} />
      <GI label="Confirmer le mot de passe" type="password" placeholder="Retapez votre mot de passe" value={form.confirmPassword} onChange={(e: any) => u('confirmPassword', e.target.value)} />
      {form.password && form.confirmPassword && form.password !== form.confirmPassword && <div style={{ fontSize: 12, color: '#F87171', marginTop: -8, marginBottom: 8 }}>Les mots de passe ne correspondent pas</div>}
    </>
  );
}
