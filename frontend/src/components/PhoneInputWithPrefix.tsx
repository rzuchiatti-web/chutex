import React, { useState } from 'react';
import { Platform } from 'react-native';

const PREFIXES = [
  { code: '+33', flag: '\u{1F1EB}\u{1F1F7}', country: 'France' },
  { code: '+32', flag: '\u{1F1E7}\u{1F1EA}', country: 'Belgique' },
  { code: '+41', flag: '\u{1F1E8}\u{1F1ED}', country: 'Suisse' },
  { code: '+352', flag: '\u{1F1F1}\u{1F1FA}', country: 'Luxembourg' },
  { code: '+377', flag: '\u{1F1F2}\u{1F1E8}', country: 'Monaco' },
  { code: '+1', flag: '\u{1F1FA}\u{1F1F8}', country: 'USA / Canada' },
  { code: '+44', flag: '\u{1F1EC}\u{1F1E7}', country: 'Royaume-Uni' },
  { code: '+49', flag: '\u{1F1E9}\u{1F1EA}', country: 'Allemagne' },
  { code: '+39', flag: '\u{1F1EE}\u{1F1F9}', country: 'Italie' },
  { code: '+34', flag: '\u{1F1EA}\u{1F1F8}', country: 'Espagne' },
  { code: '+351', flag: '\u{1F1F5}\u{1F1F9}', country: 'Portugal' },
  { code: '+212', flag: '\u{1F1F2}\u{1F1E6}', country: 'Maroc' },
  { code: '+216', flag: '\u{1F1F9}\u{1F1F3}', country: 'Tunisie' },
  { code: '+213', flag: '\u{1F1E9}\u{1F1FF}', country: 'Algerie' },
];

interface PhoneInputProps {
  value: string;
  onChangeText: (val: string) => void;
  prefix: string;
  onPrefixChange: (val: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  error?: boolean;
}

export function PhoneInputWithPrefix({ value, onChangeText, prefix, onPrefixChange, placeholder, onSubmit, error }: PhoneInputProps) {
  const [showPrefixes, setShowPrefixes] = useState(false);
  const currentFlag = PREFIXES.find(p => p.code === prefix)?.flag || PREFIXES[0].flag;

  if (Platform.OS !== 'web') return null;

  return (
    <>
      <div style={{ display: 'flex', gap: 8, alignItems: 'stretch' } as any}>
        <div onClick={() => setShowPrefixes(true)} data-testid="prefix-selector" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: `1px solid ${error ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.12)'}`, cursor: 'pointer', flexShrink: 0, minHeight: 48 } as any}>
          <span style={{ fontSize: 18 }}>{currentFlag}</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#FFF' }}>{prefix}</span>
          <i className="ri-arrow-down-s-line" style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)' }} />
        </div>
        <input
          type="tel" value={value} onChange={(e: any) => onChangeText(e.target.value)}
          placeholder={placeholder || '6 12 34 56 78'}
          onKeyDown={(e: any) => { if (e.key === 'Enter' && onSubmit) onSubmit(); }}
          style={{ flex: 1, padding: '14px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: `1px solid ${error ? 'rgba(239,68,68,0.4)' : 'rgba(255,255,255,0.12)'}`, color: '#FFF', fontSize: 16, fontWeight: 600, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none', minWidth: 0 } as any}
        />
      </div>
      {showPrefixes && (
        <div onClick={() => setShowPrefixes(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' } as any}>
          <div onClick={(e: any) => e.stopPropagation()} style={{ width: '90%', maxWidth: 340, maxHeight: '70vh', overflowY: 'auto', borderRadius: 24, background: 'rgba(20,20,30,0.92)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', padding: '20px 0' } as any}>
            <div style={{ padding: '0 20px 14px', fontSize: 16, fontWeight: 800, color: '#FFF' }}>Indicatif pays</div>
            {PREFIXES.map(p => (
              <div key={p.code} onClick={() => { onPrefixChange(p.code); setShowPrefixes(false); }} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 20px', cursor: 'pointer', background: prefix === p.code ? 'rgba(124,58,237,0.1)' : 'transparent', borderLeft: prefix === p.code ? '3px solid #7C3AED' : '3px solid transparent' } as any}>
                <span style={{ fontSize: 22 }}>{p.flag}</span>
                <div style={{ flex: 1 } as any}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: '#FFF' }}>{p.country}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.5)' }}>{p.code}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
