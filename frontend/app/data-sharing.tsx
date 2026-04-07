import React, { useState, useEffect } from 'react';
import { Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { useI18n } from '../src/context/I18nContext';
import { apiFetch } from '../src/services/api';
import FullScreenLoader from '../src/components/FullScreenLoader';

const HEALTH_OPTIONS = [
  {
    key: 'vitals_only',
    icon: 'ri-heart-pulse-line',
    title: 'Donnees vitales',
    desc: 'Pouls, tension, temperature, SpO2',
    color: '#3B82F6',
  },
  {
    key: 'all',
    icon: 'ri-health-book-line',
    title: 'Toutes les donnees',
    desc: 'Vitales + sommeil, activite, poids, stress',
    color: '#10B981',
  },
  {
    key: 'none',
    icon: 'ri-eye-off-line',
    title: 'Aucune',
    desc: 'Les gardiens ne voient aucune donnee de sante',
    color: '#EF4444',
  },
];

export default function DataSharingScreen() {
  const { token } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const [prefs, setPrefs] = useState<any>({ health_sharing: 'all', share_location: true, share_alerts: true });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await apiFetch('/api/settings/data-sharing', {}, token);
        setPrefs(data);
      } catch {} finally { setLoading(false); }
    })();
  }, [token]);

  const save = async () => {
    setSaving(true);
    try {
      await apiFetch('/api/settings/data-sharing', { method: 'PUT', body: JSON.stringify(prefs) }, token);
      if (Platform.OS === 'web') {
        router.back();
      } else {
        Alert.alert('Enregistré', 'Préférences mises a jour.');
      }
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    } finally { setSaving(false); }
  };

  if (loading) return <FullScreenLoader />;
  if (Platform.OS !== 'web') return null;

  const healthMode = prefs.health_sharing || 'all';

  return (
    <div data-testid="data-sharing-screen" style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, system-ui, sans-serif', background: '#0A0A12', overflow: 'hidden' } as any}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '70px 20px 16px', flexShrink: 0 } as any}>
        <div data-testid="data-sharing-back-btn" onClick={() => router.back()} style={{ width: 40, height: 40, borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}>
          <i className="ri-arrow-left-s-line" style={{ fontSize: 20, color: '#FFF' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#FFF' }}>Autorisations</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>Gerez ce que vos gardiens peuvent voir</div>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 120px', WebkitOverflowScrolling: 'touch' } as any}>

        {/* Health sharing section */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 } as any}>
            <i className="ri-heart-pulse-fill" style={{ fontSize: 16, color: '#3B82F6' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, textTransform: 'uppercase' } as any}>Données de santé</span>
          </div>

          {HEALTH_OPTIONS.map((opt) => {
            const selected = healthMode === opt.key;
            return (
              <div
                key={opt.key}
                data-testid={`health-option-${opt.key}`}
                onClick={() => setPrefs({ ...prefs, health_sharing: opt.key })}
                style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px',
                  borderRadius: 18, marginBottom: 8, cursor: 'pointer',
                  background: selected ? `${opt.color}12` : 'rgba(255,255,255,0.03)',
                  border: `1.5px solid ${selected ? `${opt.color}40` : 'rgba(255,255,255,0.06)'}`,
                  transition: 'all 0.2s',
                } as any}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 14, flexShrink: 0,
                  background: selected ? `${opt.color}18` : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${selected ? `${opt.color}30` : 'rgba(255,255,255,0.06)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                } as any}>
                  <i className={opt.icon} style={{ fontSize: 20, color: selected ? opt.color : 'rgba(255,255,255,0.25)' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: selected ? '#FFF' : 'rgba(255,255,255,0.5)' }}>{opt.title}</div>
                  <div style={{ fontSize: 12, color: selected ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.2)', marginTop: 2 }}>{opt.desc}</div>
                </div>
                <div style={{
                  width: 22, height: 22, borderRadius: 999, flexShrink: 0,
                  border: `2px solid ${selected ? opt.color : 'rgba(255,255,255,0.15)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.2s',
                } as any}>
                  {selected && <div style={{ width: 10, height: 10, borderRadius: 999, background: opt.color }} />}
                </div>
              </div>
            );
          })}

          {healthMode === 'vitals_only' && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '10px 4px' } as any}>
              {[
                { icon: 'ri-heart-pulse-line', label: 'Pouls' },
                { icon: 'ri-blood-test-line', label: 'Tension' },
                { icon: 'ri-temp-hot-line', label: 'Température' },
                { icon: 'ri-lungs-line', label: 'SpO2' },
              ].map((v) => (
                <div key={v.label} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 999, background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' } as any}>
                  <i className={v.icon} style={{ fontSize: 12, color: '#3B82F6' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: '#3B82F6' }}>{v.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Location sharing section */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 } as any}>
            <i className="ri-map-pin-fill" style={{ fontSize: 16, color: '#F59E0B' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, textTransform: 'uppercase' } as any}>Localisation</span>
          </div>

          <div
            data-testid="toggle-location"
            onClick={() => setPrefs({ ...prefs, share_location: !prefs.share_location })}
            style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px',
              borderRadius: 18, cursor: 'pointer',
              background: prefs.share_location ? 'rgba(245,158,11,0.06)' : 'rgba(255,255,255,0.03)',
              border: `1.5px solid ${prefs.share_location ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)'}`,
              transition: 'all 0.2s',
            } as any}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 14, flexShrink: 0,
              background: prefs.share_location ? 'rgba(245,158,11,0.1)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${prefs.share_location ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            } as any}>
              <i className={prefs.share_location ? 'ri-map-pin-line' : 'ri-map-pin-line'} style={{ fontSize: 20, color: prefs.share_location ? '#F59E0B' : 'rgba(255,255,255,0.25)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: prefs.share_location ? '#FFF' : 'rgba(255,255,255,0.5)' }}>Partager ma position</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Visible par vos gardiens et safe zones</div>
            </div>
            <div style={{
              width: 44, height: 24, borderRadius: 12, position: 'relative',
              background: prefs.share_location ? '#F59E0B' : 'rgba(255,255,255,0.1)',
              transition: 'background 0.2s', flexShrink: 0,
            } as any}>
              <div style={{
                width: 20, height: 20, borderRadius: 10, background: '#FFF',
                position: 'absolute', top: 2,
                left: prefs.share_location ? 22 : 2,
                transition: 'left 0.2s',
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
              }} />
            </div>
          </div>
        </div>

        {/* Alerts sharing section */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 } as any}>
            <i className="ri-alarm-warning-fill" style={{ fontSize: 16, color: '#EF4444' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: 1, textTransform: 'uppercase' } as any}>Alertes</span>
          </div>

          <div
            data-testid="toggle-alerts"
            onClick={() => setPrefs({ ...prefs, share_alerts: !prefs.share_alerts })}
            style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px',
              borderRadius: 18, cursor: 'pointer',
              background: prefs.share_alerts ? 'rgba(239,68,68,0.06)' : 'rgba(255,255,255,0.03)',
              border: `1.5px solid ${prefs.share_alerts ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'}`,
              transition: 'all 0.2s',
            } as any}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 14, flexShrink: 0,
              background: prefs.share_alerts ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.04)',
              border: `1px solid ${prefs.share_alerts ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.06)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            } as any}>
              <i className="ri-alarm-warning-line" style={{ fontSize: 20, color: prefs.share_alerts ? '#EF4444' : 'rgba(255,255,255,0.25)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: prefs.share_alerts ? '#FFF' : 'rgba(255,255,255,0.5)' }}>Partager les alertes</div>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>SOS, chutes, depassements de seuils</div>
            </div>
            <div style={{
              width: 44, height: 24, borderRadius: 12, position: 'relative',
              background: prefs.share_alerts ? '#EF4444' : 'rgba(255,255,255,0.1)',
              transition: 'background 0.2s', flexShrink: 0,
            } as any}>
              <div style={{
                width: 20, height: 20, borderRadius: 10, background: '#FFF',
                position: 'absolute', top: 2,
                left: prefs.share_alerts ? 22 : 2,
                transition: 'left 0.2s',
                boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
              }} />
            </div>
          </div>
        </div>

        {/* Info */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '14px 16px', borderRadius: 16, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' } as any}>
          <i className="ri-shield-check-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.2)', flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', lineHeight: 1.6 }}>
            Vos donnees sont chiffrees et ne sont accessibles qu'aux gardiens que vous avez autorises. Vous pouvez modifier ces réglages a tout moment.
          </div>
        </div>
      </div>

      {/* Save button */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '16px 20px 32px', background: 'linear-gradient(transparent, #0A0A12 30%)' } as any}>
        <div
          data-testid="save-sharing-btn"
          onClick={saving ? undefined : save}
          style={{
            padding: '17px', borderRadius: 999, textAlign: 'center', cursor: saving ? 'wait' : 'pointer',
            background: '#FFF', color: '#0A0A12', fontSize: 15, fontWeight: 800,
            opacity: saving ? 0.6 : 1, transition: 'opacity 0.2s',
          } as any}
        >
          {saving ? 'Enregistrément...' : 'Enregistrér'}
        </div>
      </div>
    </div>
  );
}
