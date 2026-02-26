import React, { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LANGUAGES = [
  { code: 'fr', flag: '\u{1F1EB}\u{1F1F7}', label: 'Francais' },
  { code: 'en', flag: '\u{1F1EC}\u{1F1E7}', label: 'English' },
  { code: 'es', flag: '\u{1F1EA}\u{1F1F8}', label: 'Espanol' },
  { code: 'de', flag: '\u{1F1E9}\u{1F1EA}', label: 'Deutsch' },
  { code: 'it', flag: '\u{1F1EE}\u{1F1F9}', label: 'Italiano' },
  { code: 'pt', flag: '\u{1F1F5}\u{1F1F9}', label: 'Portugues' },
  { code: 'ar', flag: '\u{1F1F2}\u{1F1E6}', label: 'العربية' },
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
    <div style={{ position: 'relative', display: 'inline-flex', justifyContent: 'center' } as any}>
      <div data-testid="language-picker" onClick={() => setOpen(!open)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', cursor: 'pointer' } as any}>
        <span style={{ fontSize: 18 }}>{current.flag}</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase' }}>{current.code}</span>
        <i className="ri-arrow-down-s-line" style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }} />
      </div>
      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 998 } as any} />
          <div style={{ position: 'absolute', top: '100%', marginTop: 6, zIndex: 999, borderRadius: 14, background: 'rgba(10,15,25,0.95)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', padding: 4, minWidth: 150, boxShadow: '0 8px 32px rgba(0,0,0,0.4)' } as any}>
            {LANGUAGES.map(l => (
              <div key={l.code} onClick={() => select(l.code)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10, cursor: 'pointer', background: lang === l.code ? 'rgba(255,255,255,0.08)' : 'transparent' } as any}>
                <span style={{ fontSize: 16 }}>{l.flag}</span>
                <span style={{ fontSize: 12, color: lang === l.code ? '#FFF' : 'rgba(255,255,255,0.5)', fontWeight: lang === l.code ? 700 : 400, flex: 1 }}>{l.label}</span>
                {lang === l.code && <i className="ri-check-line" style={{ fontSize: 14, color: '#10B981' }} />}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
