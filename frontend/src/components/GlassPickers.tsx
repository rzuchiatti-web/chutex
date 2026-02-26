import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { PREFIXES } from './register/RegisterUI';

const GLASS_OVERLAY = { position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', background: 'rgba(0,0,0,0.4)' } as any;
const GLASS_CARD = { position: 'relative', zIndex: 1, width: '90%', maxWidth: 340, maxHeight: '70vh', borderRadius: 24, padding: '24px 16px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', boxShadow: '0 16px 64px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column' } as any;
const CLOSE_BTN = { position: 'absolute', top: 10, right: 10, width: 30, height: 30, borderRadius: 999, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any;

function GlassPortal({ children, open }: { children: React.ReactNode; open: boolean }) {
  if (!open || typeof document === 'undefined') return null;
  return createPortal(children, document.body);
}

export function PrefixPicker({ value, onChange }: { value: string; onChange: (code: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const current = PREFIXES.find(p => p.code === value) || PREFIXES[0];
  const filtered = search ? PREFIXES.filter(p => p.label.toLowerCase().includes(search.toLowerCase()) || p.code.includes(search)) : PREFIXES;

  return (
    <>
      <div data-testid="prefix-picker-btn" onClick={() => { setOpen(true); setSearch(''); }} style={{ padding: '13px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 } as any}>
        <span style={{ fontSize: 16 }}>{current.flag}</span>
        <span style={{ fontSize: 14, color: '#FFF', fontWeight: 600 }}>{value}</span>
        <i className="ri-arrow-down-s-line" style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }} />
      </div>

      <GlassPortal open={open}>
        <div style={GLASS_OVERLAY}>
          <div onClick={() => setOpen(false)} style={{ position: 'absolute', inset: 0 } as any} />
          <div data-testid="prefix-picker-popup" style={GLASS_CARD}>
            <div onClick={() => setOpen(false)} style={CLOSE_BTN}><i className="ri-close-line" style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }} /></div>
            <div style={{ textAlign: 'center', marginBottom: 14 } as any}>
              <i className="ri-phone-line" style={{ fontSize: 24, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }} />
              <div style={{ fontSize: 15, fontWeight: 700, color: '#FFF' }}>Indicatif pays</div>
            </div>
            <input data-testid="prefix-search" placeholder="Rechercher..." value={search} onChange={(e: any) => setSearch(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 999, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: 10 } as any} />
            <div style={{ overflowY: 'auto', flex: 1 } as any}>
              {filtered.map(p => (
                <div key={p.code} data-testid={`prefix-${p.code}`} onClick={() => { onChange(p.code); setOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 14, cursor: 'pointer', background: value === p.code ? 'rgba(255,255,255,0.1)' : 'transparent', border: value === p.code ? '1px solid rgba(255,255,255,0.15)' : '1px solid transparent' } as any}>
                  <span style={{ fontSize: 20 }}>{p.flag}</span>
                  <span style={{ fontSize: 13, color: value === p.code ? '#FFF' : 'rgba(255,255,255,0.55)', fontWeight: value === p.code ? 700 : 400, flex: 1 }}>{p.label}</span>
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{p.code}</span>
                  {value === p.code && <i className="ri-check-line" style={{ fontSize: 14, color: '#10B981' }} />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </GlassPortal>
    </>
  );
}

const COUNTRIES = [
  { code: 'France', flag: '\u{1F1EB}\u{1F1F7}' }, { code: 'Belgique', flag: '\u{1F1E7}\u{1F1EA}' },
  { code: 'Suisse', flag: '\u{1F1E8}\u{1F1ED}' }, { code: 'Luxembourg', flag: '\u{1F1F1}\u{1F1FA}' },
  { code: 'Allemagne', flag: '\u{1F1E9}\u{1F1EA}' }, { code: 'Italie', flag: '\u{1F1EE}\u{1F1F9}' },
  { code: 'Espagne', flag: '\u{1F1EA}\u{1F1F8}' }, { code: 'Portugal', flag: '\u{1F1F5}\u{1F1F9}' },
  { code: 'Royaume-Uni', flag: '\u{1F1EC}\u{1F1E7}' }, { code: 'Irlande', flag: '\u{1F1EE}\u{1F1EA}' },
  { code: 'Pays-Bas', flag: '\u{1F1F3}\u{1F1F1}' }, { code: 'Autriche', flag: '\u{1F1E6}\u{1F1F9}' },
  { code: 'Pologne', flag: '\u{1F1F5}\u{1F1F1}' }, { code: 'Maroc', flag: '\u{1F1F2}\u{1F1E6}' },
  { code: 'Tunisie', flag: '\u{1F1F9}\u{1F1F3}' }, { code: 'Algerie', flag: '\u{1F1E9}\u{1F1FF}' },
  { code: 'Canada', flag: '\u{1F1E8}\u{1F1E6}' }, { code: 'USA', flag: '\u{1F1FA}\u{1F1F8}' },
  { code: 'Monaco', flag: '\u{1F1F2}\u{1F1E8}' }, { code: 'Andorre', flag: '\u{1F1E6}\u{1F1E9}' },
];

export function CountryPicker({ value, onChange }: { value: string; onChange: (country: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const current = COUNTRIES.find(c => c.code === value);
  const filtered = search ? COUNTRIES.filter(c => c.code.toLowerCase().includes(search.toLowerCase())) : COUNTRIES;

  return (
    <>
      <div style={{ marginBottom: 14 } as any}>
        <div style={{ fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 5 }}>Pays</div>
        <div data-testid="country-picker-btn" onClick={() => { setOpen(true); setSearch(''); }} style={{ width: '100%', padding: '13px 16px', borderRadius: 999, background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', color: '#FFF', fontSize: 14, fontFamily: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxSizing: 'border-box' } as any}>
          {current && <span style={{ fontSize: 16 }}>{current.flag}</span>}
          <span style={{ flex: 1, color: value ? '#FFF' : 'rgba(255,255,255,0.35)' }}>{value || 'Selectionner un pays'}</span>
          <i className="ri-arrow-down-s-line" style={{ fontSize: 14, color: 'rgba(255,255,255,0.3)' }} />
        </div>
      </div>

      <GlassPortal open={open}>
        <div style={GLASS_OVERLAY}>
          <div onClick={() => setOpen(false)} style={{ position: 'absolute', inset: 0 } as any} />
          <div data-testid="country-picker-popup" style={GLASS_CARD}>
            <div onClick={() => setOpen(false)} style={CLOSE_BTN}><i className="ri-close-line" style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)' }} /></div>
            <div style={{ textAlign: 'center', marginBottom: 14 } as any}>
              <i className="ri-global-line" style={{ fontSize: 24, color: 'rgba(255,255,255,0.5)', display: 'block', marginBottom: 6 }} />
              <div style={{ fontSize: 15, fontWeight: 700, color: '#FFF' }}>Pays</div>
            </div>
            <input data-testid="country-search" placeholder="Rechercher..." value={search} onChange={(e: any) => setSearch(e.target.value)} style={{ width: '100%', padding: '10px 14px', borderRadius: 999, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', fontSize: 13, fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box', marginBottom: 10 } as any} />
            <div style={{ overflowY: 'auto', flex: 1 } as any}>
              {filtered.map(c => (
                <div key={c.code} data-testid={`country-${c.code}`} onClick={() => { onChange(c.code); setOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 14, cursor: 'pointer', background: value === c.code ? 'rgba(255,255,255,0.1)' : 'transparent', border: value === c.code ? '1px solid rgba(255,255,255,0.15)' : '1px solid transparent' } as any}>
                  <span style={{ fontSize: 20 }}>{c.flag}</span>
                  <span style={{ fontSize: 13, color: value === c.code ? '#FFF' : 'rgba(255,255,255,0.55)', fontWeight: value === c.code ? 700 : 400, flex: 1 }}>{c.code}</span>
                  {value === c.code && <i className="ri-check-line" style={{ fontSize: 14, color: '#10B981' }} />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </GlassPortal>
    </>
  );
}
