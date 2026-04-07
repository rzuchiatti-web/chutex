import React, { useState, useEffect } from 'react';
import { View, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';

const C = { bg: '#0A0A12', text: '#FFF', sub: 'rgba(255,255,255,0.5)', muted: 'rgba(255,255,255,0.25)', green: '#10B981', amber: '#F59E0B', red: '#EF4444', accent: '#3B82F6' };

export default function SubscriptionStatusPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { token } = useAuth();
  const router = useRouter();
  const [sub, setSub] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token || !id) return;
    const check = async () => {
      try {
        const data = await apiFetch(`/api/pro/my-subscription`, {}, token);
        setSub(data);
      } catch {}
      finally { setLoading(false); }
    };
    check();
    const iv = setInterval(check, 3000);
    return () => clearInterval(iv);
  }, [token, id]);

  if (Platform.OS !== 'web') return null;

  const status = sub?.status;
  const isActive = status === 'active';
  const isPending = status === 'payment_pending';
  const color = isActive ? C.green : isPending ? C.amber : C.red;
  const icon = isActive ? 'ri-check-line' : isPending ? 'ri-time-line' : 'ri-close-line';
  const label = isActive ? 'Abonnement active !' : isPending ? 'Paiement en cours...' : 'Statut: ' + (status || 'inconnu');

  return (
    <div style={{ position: 'absolute', inset: 0, background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, system-ui, sans-serif' } as any}>
      <div style={{ textAlign: 'center', maxWidth: 320, padding: 24 } as any}>
        {loading ? (
          <div style={{ width: 48, height: 48, borderRadius: '50%', border: '4px solid rgba(255,255,255,0.06)', borderTopColor: C.accent, animation: 'spin 0.8s linear infinite', margin: '0 auto 20px' } as any} />
        ) : (
          <div style={{ width: 64, height: 64, borderRadius: 999, background: `${color}15`, border: `2px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' } as any}>
            <i className={icon} style={{ fontSize: 32, color }} />
          </div>
        )}
        <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 8 }}>{loading ? 'Vérification...' : label}</div>
        {isActive && <div style={{ fontSize: 13, color: C.sub, lineHeight: 1.5, marginBottom: 20 }}>Votre abonnement {sub.type} a été active avec succes. Votre professionnel peut maintenant gerer vos exercices.</div>}
        <div onClick={() => router.replace('/(tabs)' as any)} style={{ padding: '14px 28px', borderRadius: 999, background: `${color}15`, border: `1px solid ${color}25`, cursor: 'pointer', fontSize: 14, fontWeight: 700, color } as any}>
          Retour au tableau de bord
        </div>
      </div>
      <style dangerouslySetInnerHTML={{ __html: `@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}` }} />
    </div>
  );
}
