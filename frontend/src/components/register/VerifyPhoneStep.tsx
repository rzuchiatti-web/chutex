import React, { useState, useEffect, useRef } from 'react';
import { INPUT_STYLE } from './RegisterUI';
import { apiFetch } from '../../services/api';

export default function VerifyPhoneStep({ phone, onVérifiéd }: { phone: string; onVérifiéd: () => void }) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [devCode, setDevCode] = useState('');
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const sendCode = async () => {
    setSending(true); setError(''); setDevCode('');
    try {
      const res = await apiFetch('/api/auth/send-vérification-code', { method: 'POST', body: JSON.stringify({ phone }) });
      if (res.dev_code) setDevCode(res.dev_code);
      setCooldown(60);
    } catch (e: any) { setError(e.message); } finally { setSending(false); }
  };

  useEffect(() => { sendCode(); }, []);
  useEffect(() => { if (cooldown > 0) { const t = setTimeout(() => setCooldown(cooldown - 1), 1000); return () => clearTimeout(t); } }, [cooldown]);

  const handleDigit = (idx: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...digits];
    next[idx] = val;
    setDigits(next);
    if (val && idx < 5) refs.current[idx + 1]?.focus();
    if (next.every(d => d)) verify(next.join(''));
  };

  const handleKeyDown = (idx: number, e: any) => {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) refs.current[idx - 1]?.focus();
  };

  const verify = async (code: string) => {
    setVerifying(true); setError('');
    try {
      await apiFetch('/api/auth/verify-code', { method: 'POST', body: JSON.stringify({ phone, code }) });
      onVérifiéd();
    } catch (e: any) {
      setError(e.message || 'Code incorrect');
      setDigits(['', '', '', '', '', '']);
      refs.current[0]?.focus();
    } finally { setVerifying(false); }
  };

  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: 24 } as any}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' } as any}>
          <i className="ri-smartphone-line" style={{ fontSize: 26, color: '#10B981' }} />
        </div>
        <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', marginBottom: 6 }}>Vérification du telephone</div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
          Un code a 6 chiffres a été envoye au<br />
          <span style={{ color: '#FFF', fontWeight: 700 }}>{phone}</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 } as any}>
        {digits.map((d, i) => (
          <input
            key={i}
            ref={el => { refs.current[i] = el; }}
            data-testid={`verify-digit-${i}`}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={d}
            onChange={(e: any) => handleDigit(i, e.target.value)}
            onKeyDown={(e: any) => handleKeyDown(i, e)}
            style={{
              ...INPUT_STYLE,
              width: 48, height: 56, padding: 0,
              textAlign: 'center', fontSize: 22, fontWeight: 900,
              letterSpacing: 0, borderRadius: 14,
            }}
          />
        ))}
      </div>

      {error && <div data-testid="verify-error" style={{ textAlign: 'center', fontSize: 13, color: '#F87171', marginBottom: 12 }}>{error}</div>}
      {verifying && <div style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.4)', marginBottom: 12 }}>Vérification en cours...</div>}

      {devCode && (
        <div style={{ textAlign: 'center', padding: '10px 16px', borderRadius: 12, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', marginBottom: 12 } as any}>
          <div style={{ fontSize: 10, color: '#F59E0B', marginBottom: 2 }}>Mode test - code :</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#FFF', letterSpacing: 4 }}>{devCode}</div>
        </div>
      )}

      <div style={{ textAlign: 'center' } as any}>
        {cooldown > 0 ? (
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Renvoyer dans {cooldown}s</span>
        ) : (
          <div data-testid="resend-code-btn" onClick={sending ? undefined : sendCode} style={{ fontSize: 13, fontWeight: 700, color: '#FFF', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 } as any}>
            <i className="ri-refresh-line" style={{ fontSize: 14 }} />Renvoyer le code
          </div>
        )}
      </div>
    </>
  );
}
