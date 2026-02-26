import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGES = [
  { code: 'fr', flag: '\u{1F1EB}\u{1F1F7}', label: 'Francais' },
  { code: 'en', flag: '\u{1F1EC}\u{1F1E7}', label: 'English' },
  { code: 'es', flag: '\u{1F1EA}\u{1F1F8}', label: 'Espanol' },
  { code: 'de', flag: '\u{1F1E9}\u{1F1EA}', label: 'Deutsch' },
  { code: 'it', flag: '\u{1F1EE}\u{1F1F9}', label: 'Italiano' },
  { code: 'pt', flag: '\u{1F1F5}\u{1F1F9}', label: 'Portugues' },
  { code: 'ar', flag: '\u{1F1F2}\u{1F1E6}', label: '\u0627\u0644\u0639\u0631\u0628\u064A\u0629' },
];

export default function LanguagePicker({ lang, setLang }: { lang: string; setLang: (l: string) => void }) {
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find(l => l.code === lang) || LANGUAGES[0];

  const select = (code: string) => {
    setLang(code);
    setOpen(false);
    AsyncStorage.setItem('chutex_lang', code).catch(() => {});
  };

  return (
    <>
      <div data-testid="language-picker" onClick={() => setOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', cursor: 'pointer' } as any}>
        <span style={{ fontSize: 18 }}>{current.flag}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>{current.code}</span>
        <i className="ri-arrow-down-s-line" style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }} />
      </div>

      {open && typeof document !== 'undefined' && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', background: 'rgba(0,0,0,0.4)' } as any}>
          {/* Backdrop click */}
          <div onClick={() => setOpen(false)} style={{ position: 'absolute', inset: 0 } as any} />

          {/* Glass card */}
          <div data-testid="language-picker-popup" style={{
            position: 'relative', zIndex: 1, width: '90%', maxWidth: 320,
            borderRadius: 24, padding: '28px 20px 20px',
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)',
            boxShadow: '0 16px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
          } as any}>
            {/* Close button */}
            <div onClick={() => setOpen(false)} style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
              <i className="ri-close-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)' }} />
            </div>

            {/* Title */}
            <div style={{ textAlign: 'center', marginBottom: 20 } as any}>
              <i className="ri-global-line" style={{ fontSize: 28, color: 'rgba(255,255,255,0.5)', marginBottom: 8, display: 'block' }} />
              <div style={{ fontSize: 16, fontWeight: 700, color: '#FFF' }}>Langue</div>
            </div>

            {/* Language list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 } as any}>
              {LANGUAGES.map(l => (
                <div key={l.code} data-testid={`lang-option-${l.code}`} onClick={() => select(l.code)} style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 14, cursor: 'pointer',
                  background: lang === l.code ? 'rgba(255,255,255,0.1)' : 'transparent',
                  border: lang === l.code ? '1px solid rgba(255,255,255,0.15)' : '1px solid transparent',
                  transition: 'background 0.15s ease',
                } as any}>
                  <span style={{ fontSize: 22 }}>{l.flag}</span>
                  <span style={{ fontSize: 14, color: lang === l.code ? '#FFF' : 'rgba(255,255,255,0.55)', fontWeight: lang === l.code ? 700 : 400, flex: 1 }}>{l.label}</span>
                  {lang === l.code && <i className="ri-check-line" style={{ fontSize: 16, color: '#10B981' }} />}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
