import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { Icon } from '../WebIcon';
import { useI18n } from '../../context/I18nContext';
import { CHX, isDarkMode, webShadow, webGlass } from './constants';

/* ─── GLASS CARD (Chutex style) ─── */
export const Card = ({ children, style, testID }: any) => {
  if (Platform.OS === 'web') {
    return <div data-testid={testID} className={CHX.cardClass} style={{ padding: 14, marginBottom: 12, ...style }}>{children}</div>;
  }
  return <View testID={testID} style={[{ backgroundColor: CHX.bg, borderRadius: 22, borderWidth: 1, borderColor: CHX.border, padding: 14, marginBottom: 12, ...webShadow, ...webGlass }, style]}>{children}</View>;
};

/* ─── HEADER ACCOUNT CARD (Chutex style) ─── */
export const HeroCard = ({ children, style }: any) => {
  if (Platform.OS === 'web') {
    return <div className={CHX.headerClass} style={{ padding: 14, marginBottom: 14, ...style }}>{children}</div>;
  }
  return <View style={[{ borderRadius: 24, padding: 14, marginBottom: 14, overflow: 'hidden', backgroundColor: '#23355b' }, style]}>{children}</View>;
};

/* ─── STATUS BADGE ─── */
export const StatusBadge = ({ label, color }: { label: string; color?: string }) => (
  <View style={{ backgroundColor: color ? `${color}20` : 'rgba(16,185,129,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99, alignSelf: 'flex-start', marginTop: 4 }}>
    <Text style={{ fontSize: 10, fontWeight: '600', color: color || '#10B981', letterSpacing: 0.3, textTransform: 'uppercase' }}>{label}</Text>
  </View>
);

/* ─── CHUTEX BUTTON (scan + halo) ─── */
export const PillButton = ({ label, icon, onPress, testID, variant = 'dark', isIA }: any) => {
  if (Platform.OS === 'web') {
    const cls = isIA ? 'chx-btn chx-btn-ia has-glare' : variant === 'danger' ? CHX.btnDangerClass : CHX.btnClass;
    return (
      <button data-testid={testID} className={`${cls} has-glare`} onClick={onPress} style={{ marginBottom: 12, width: '100%' } as any}>
        {isIA && <span className="chx-btn-icon" style={{ width:18,height:18,borderRadius:99,display:'grid',placeItems:'center',fontSize:11,fontWeight:800,border:'1px solid rgba(31,41,55,.14)',background:'rgba(255,255,255,.52)',color:'#1f2937' } as any}>AI</span>}
        {icon && !isIA && <span style={{ position:'relative',zIndex:4 }}><Icon name={icon} size={16} color={variant === 'danger' ? '#FFF' : (isDarkMode ? '#0b0f17' : '#FFF')} /></span>}
        <span className="chx-btn-label">{label}</span>
        <span className="chx-btn-scan"></span><span className="chx-btn-halo"></span>
      </button>
    );
  }
  return (
    <TouchableOpacity testID={testID} activeOpacity={0.85} style={{
      backgroundColor: isIA ? '#e8c4f0' : variant === 'danger' ? '#e93f5d' : '#111827',
      borderRadius: 999, paddingVertical: 14, paddingHorizontal: 24,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12,
    }} onPress={onPress}>
      {icon && <Icon name={icon} size={16} color={isIA ? '#1a2030' : '#FFF'} />}
      <Text style={{ color: isIA ? '#1a2030' : '#FFFFFF', fontSize: 14, fontWeight: '600' }}>{label}</Text>
    </TouchableOpacity>
  );
};

/* ─── ICON BUTTON (round gray, Chutex style) ─── */
export const IconBtn = ({ icon, onPress, testID, badge }: any) => (
  <TouchableOpacity testID={testID} activeOpacity={0.85} onPress={onPress} style={{
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#eef2f6', borderWidth: 1, borderColor: '#d8e2ef',
    justifyContent: 'center', alignItems: 'center',
    ...(Platform.OS === 'web' ? { boxShadow: 'inset 0 1px 0 rgba(255,255,255,.96)' } : {}),
  }}>
    <Icon name={icon} size={18} color="#111827" />
    {badge && <View style={{ position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444', borderWidth: 2, borderColor: '#eef2f6' }} />}
  </TouchableOpacity>
);

/* ─── QUICK ACTION ─── */
export const QuickAction = ({ icon, label, onPress }: any) => (
  <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={{ alignItems: 'center', flex: 1 }}>
    <View style={{
      width: 48, height: 48, borderRadius: 14, backgroundColor: isDarkMode ? 'rgba(255,255,255,.06)' : '#eef2f6',
      justifyContent: 'center', alignItems: 'center', marginBottom: 6,
      borderWidth: 1, borderColor: isDarkMode ? 'rgba(255,255,255,.10)' : '#d8e2ef',
    }}>
      <Icon name={icon} size={20} color={isDarkMode ? '#f4f7ff' : '#111827'} />
    </View>
    <Text style={{ fontSize: 11, fontWeight: '500', color: CHX.fgSub, textAlign: 'center' }}>{label}</Text>
  </TouchableOpacity>
);

/* ─── SECTION HEADER ─── */
export const SectionHeader = ({ title, action, onAction }: any) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 8 }}>
    <Text style={{ fontSize: 12, fontWeight: '700', color: CHX.fgMuted, letterSpacing: 1.2, textTransform: 'uppercase' }}>{title}</Text>
    {action && (
      <TouchableOpacity onPress={onAction}>
        <Text style={{ fontSize: 13, fontWeight: '600', color: CHX.fgSub }}>{action}</Text>
      </TouchableOpacity>
    )}
  </View>
);

/* ───── LANGUAGE FLAG PICKER ───── */
export function LanguageFlagButton() {
  const { lang, setLang, flags } = useI18n();
  const [open, setOpen] = useState(false);
  const current = flags.find((f: any) => f.code === lang) || flags[0];
  return (
    <View style={{ position: 'relative', zIndex: 9999 }}>
      <TouchableOpacity testID="lang-flag-btn" style={{ width: 34, height: 34, borderRadius: 12, backgroundColor: current.color, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)' }} onPress={() => setOpen(!open)}>
        <Text style={{ fontSize: 10, fontWeight: '900', color: '#FFF' }}>{current.code}</Text>
      </TouchableOpacity>
      {open && (
        <View style={{ position: 'absolute', top: 40, right: 0, backgroundColor: '#FFFFFF', borderRadius: 18, padding: 8, minWidth: 130, zIndex: 99999, ...webShadow, ...(Platform.OS === 'web' ? { boxShadow: '0 8px 32px rgba(0,0,0,0.12)' } : {}) }}>
          {flags.map((f: any) => (
            <TouchableOpacity key={f.code} testID={`lang-option-${f.code}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingHorizontal: 10, borderRadius: 10, backgroundColor: lang === f.code ? 'rgba(0,0,0,0.08)' : 'transparent' }} onPress={() => { setLang(f.code); setOpen(false); }}>
              <View style={{ width: 24, height: 24, borderRadius: 8, backgroundColor: f.color, justifyContent: 'center', alignItems: 'center' }}>
                <Text style={{ fontSize: 8, fontWeight: '800', color: '#FFF' }}>{f.code}</Text>
              </View>
              <Text style={{ fontSize: 13, fontWeight: lang === f.code ? '700' : '500', color: '#111827' }}>{f.code}</Text>
              {lang === f.code && <Icon name="checkmark" size={14} color="#111827" />}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}
