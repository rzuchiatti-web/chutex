import { Icon, MCIcon } from '../src/components/WebIcon';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, ActivityIndicator, Switch, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';
import { apiFetch } from '../src/services/api';
import { useRouter } from 'expo-router';

const REMINDER_IMAGES: Record<string, string> = {
  hydration: 'https://customer-assets.emergentagent.com/job_1026023a-fd73-4c44-a002-9618d437c4c8/artifacts/7s8stuxi_hydratation.png',
  medication: 'https://customer-assets.emergentagent.com/job_1026023a-fd73-4c44-a002-9618d437c4c8/artifacts/y3xje768_traitement.png',
  alarm: 'https://customer-assets.emergentagent.com/job_1026023a-fd73-4c44-a002-9618d437c4c8/artifacts/hzoi0qcr_alarmes.png',
};
const CATEGORIES = [
  { key: 'hydration', label: 'Hydratation', types: ['hydration'] },
  { key: 'medication', label: 'Traitements', types: ['medication'] },
  { key: 'alarm', label: 'Alarmes quotidiennes', types: ['alarm', 'custom'] },
];
const DAYS = [
  { key: 'lun', s: 'LU' }, { key: 'mar', s: 'MA' }, { key: 'mer', s: 'ME' },
  { key: 'jeu', s: 'JE' }, { key: 'ven', s: 'VE' }, { key: 'sam', s: 'SA' }, { key: 'dim', s: 'DI' },
];
const glass = Platform.OS === 'web' ? { backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', boxShadow: '0 14px 40px rgba(0,0,0,0.35)' } : {};
const GlassCard = ({ children, style }: any) => (
  <View style={[{ backgroundColor: '#FFFFFF', borderRadius: 24, borderWidth: 1, borderColor: 'rgba(0,0,0,0.06)', padding: 18, marginBottom: 12, ...glass }, style]}>{children}</View>
);

function getTimeRemaining(reminders: any[]): string {
  const now = new Date(); const nowMin = now.getHours() * 60 + now.getMinutes();
  const dayMap: Record<string, number> = { dim: 0, lun: 1, mar: 2, mer: 3, jeu: 4, ven: 5, sam: 6 };
  const today = now.getDay(); let closest = Infinity;
  for (const r of reminders) {
    if (!r.active || !r.time) continue;
    const [h, m] = r.time.split(':').map(Number); const rMin = h * 60 + m;
    for (const d of (r.days || [])) {
      const dn = dayMap[d]; if (dn === undefined) continue;
      let diff = ((dn - today + 7) % 7) * 1440 + (rMin - nowMin);
      if (diff <= 0) diff += 7 * 1440;
      if (diff < closest) closest = diff;
    }
  }
  if (closest === Infinity) return '--:--';
  return `${Math.floor(closest / 60).toString().padStart(2, '0')}:${(closest % 60).toString().padStart(2, '0')}`;
}

export default function RemindersScreen() {
  const { colors } = useTheme();
  const { token } = useAuth();
  const router = useRouter();
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editR, setEditR] = useState<any>(null);
  const [fTitle, setFTitle] = useState('');
  const [fTime, setFTime] = useState('08:00');
  const [fDosage, setFDosage] = useState('');
  const [fDays, setFDays] = useState(DAYS.map(d => d.key));
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const fetch_ = useCallback(async () => {
    try { setReminders(await apiFetch('/api/reminders', {}, token)); } catch {} finally { setLoading(false); }
  }, [token]);
  useEffect(() => { fetch_(); }, [fetch_]);

  const openCreate = () => { setEditR(null); setFTitle(''); setFTime('08:00'); setFDosage(''); setFDays(DAYS.map(d => d.key)); setShowModal(true); };
  const openEdit = (r: any) => { setEditR(r); setFTitle(r.title || ''); setFTime(r.time || '08:00'); setFDosage(r.dosage || ''); setFDays(r.days || DAYS.map(d => d.key)); setShowModal(true); };

  const save = async () => {
    if (!fTitle.trim()) { if (Platform.OS === 'web') window.alert('Titre requis'); return; }
    setSaving(true);
    try {
      if (editR) { await apiFetch(`/api/reminders/${editR.id}`, { method: 'PUT', body: JSON.stringify({ title: fTitle.trim(), time: fTime, days: fDays, dosage: fDosage }) }, token); }
      else { const type = activeCat === 'medication' ? 'medication' : activeCat === 'hydration' ? 'hydration' : 'alarm'; await apiFetch('/api/reminders', { method: 'POST', body: JSON.stringify({ reminder_type: type, title: fTitle.trim(), time: fTime, days: fDays, dosage: fDosage, interval_minutes: type === 'hydration' ? 120 : 0 }) }, token); }
      setShowModal(false); fetch_();
    } catch (e: any) { if (Platform.OS === 'web') window.alert(e.message); } finally { setSaving(false); }
  };

  const toggleActive = async (rid: string) => { try { await apiFetch(`/api/reminders/${rid}/toggle`, { method: 'PUT' }, token); fetch_(); } catch {} };

  const doDelete = async (rid: string) => {
    try { await apiFetch(`/api/reminders/${rid}`, { method: 'DELETE' }, token); setConfirmDelete(null); fetch_(); } catch (e: any) { if (Platform.OS === 'web') window.alert(e.message); }
  };

  if (loading) return <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF', justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#111827" /></SafeAreaView>;

  const cat = activeCat ? CATEGORIES.find(c => c.key === activeCat) : null;
  const catR = cat ? reminders.filter(r => cat.types.includes(r.reminder_type)) : [];

  if (!activeCat) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4, marginRight: 12 }}><Icon name="chevron-back" size={24} color="#111827" /></TouchableOpacity>
          <Text style={{ flex: 1, fontSize: 22, fontWeight: '900', color: '#111827' }}>Mes rappels</Text>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
          {CATEGORIES.map(c => {
            const items = reminders.filter(r => c.types.includes(r.reminder_type));
            return (
              <TouchableOpacity key={c.key} onPress={() => setActiveCat(c.key)}>
                <GlassCard style={{ flexDirection: 'row', alignItems: 'center', padding: 20 }}>
                  <Image source={{ uri: REMINDER_IMAGES[c.key] }} style={{ width: 56, height: 56, resizeMode: 'contain', marginRight: 16 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827' }}>{c.label}</Text>
                    <Text style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>{items.length} rappel{items.length !== 1 ? 's' : ''}</Text>
                    <Text style={{ fontSize: 12, fontWeight: '800', color: '#111827', marginTop: 6 }}>Prochain dans {getTimeRemaining(items.filter(r => r.active))}</Text>
                  </View>
                  <Icon name="chevron-forward" size={20} color="#888" />
                </GlassCard>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
        <TouchableOpacity onPress={() => setActiveCat(null)} style={{ padding: 4, marginRight: 12 }}><Icon name="chevron-back" size={24} color="#111827" /></TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 22, fontWeight: '900', color: '#111827' }}>{cat?.label}</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        <View style={{ alignItems: 'center', marginBottom: 16 }}>
          <Image source={{ uri: REMINDER_IMAGES[activeCat] }} style={{ width: 80, height: 80, resizeMode: 'contain' }} />
        </View>

        {catR.map(r => (
          <GlassCard key={r.id} style={{ opacity: r.active ? 1 : 0.5 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <TouchableOpacity style={{ flex: 1 }} onPress={() => openEdit(r)}>
                <Text style={{ fontSize: 30, fontWeight: '900', color: '#111827' }}>{r.time}</Text>
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#111827', marginTop: 4 }}>{r.title}</Text>
                {r.dosage ? <Text style={{ fontSize: 12, color: '#6B7280' }}>{r.dosage}</Text> : null}
                {/* Day chips */}
                <View style={{ flexDirection: 'row', gap: 4, marginTop: 8 }}>
                  {DAYS.map(d => (
                    <View key={d.key} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: r.days?.includes(d.key) ? '#000' : 'rgba(0,0,0,0.06)', justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ fontSize: 9, fontWeight: '700', color: r.days?.includes(d.key) ? '#FFF' : '#AAA' }}>{d.s}</Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
              <View style={{ alignItems: 'center', gap: 8 }}>
                <Switch value={r.active} onValueChange={() => toggleActive(r.id)} trackColor={{ true: '#4CAF50', false: '#DDD' }} />
                <TouchableOpacity onPress={() => setConfirmDelete(r.id)} style={{ padding: 6 }}>
                  <Icon name="trash-outline" size={20} color="#E53935" />
                </TouchableOpacity>
              </View>
            </View>
          </GlassCard>
        ))}

        {catR.length === 0 && <GlassCard style={{ alignItems: 'center', padding: 32 }}><Icon name="alarm-outline" size={32} color="#888" /><Text style={{ fontSize: 14, color: '#6B7280', marginTop: 8 }}>Aucun rappel</Text></GlassCard>}

        <TouchableOpacity style={{ backgroundColor: '#FFFFFF', borderRadius: 9999, paddingVertical: 16, alignItems: 'center', marginTop: 4 }} onPress={openCreate}>
          <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '800', textTransform: 'uppercase' }}>AJOUTER UN RAPPEL</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Delete Confirm */}
      {confirmDelete && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 32, zIndex: 100 }}>
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, alignItems: 'center' }}>
            <Icon name="trash-outline" size={32} color="#E53935" />
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827', marginTop: 12 }}>Supprimer ce rappel ?</Text>
            <Text style={{ fontSize: 13, color: '#6B7280', marginTop: 4 }}>Cette action est irreversible</Text>
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 20, width: '100%' }}>
              <TouchableOpacity style={{ flex: 1, paddingVertical: 14, borderRadius: 9999, backgroundColor: '#F5F5F5', alignItems: 'center' }} onPress={() => setConfirmDelete(null)}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#6B7280' }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, paddingVertical: 14, borderRadius: 9999, backgroundColor: '#E53935', alignItems: 'center' }} onPress={() => doDelete(confirmDelete)}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#FFF' }}>SUPPRIMER</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Create/Edit Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: '#111827', marginBottom: 16 }}>{editR ? 'Modifier' : 'Nouveau rappel'}</Text>
            {Platform.OS === 'web' && (<>
              <div style={{ marginBottom: 12 }}><div style={{ fontSize: 11, fontWeight: '700', color: '#6B7280', marginBottom: 6, textTransform: 'uppercase' as any, letterSpacing: 1 }}>Titre</div><input type="text" placeholder="Ex: Boire 1 verre" value={fTitle} onChange={(e: any) => setFTitle(e.target.value)} style={{ width: '100%', fontSize: 15, padding: '12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(245,245,245,0.8)', fontFamily: 'system-ui', boxSizing: 'border-box' as any }} /></div>
              <div style={{ marginBottom: 12 }}><div style={{ fontSize: 11, fontWeight: '700', color: '#6B7280', marginBottom: 6, textTransform: 'uppercase' as any, letterSpacing: 1 }}>Heure</div><input type="time" value={fTime} onChange={(e: any) => setFTime(e.target.value)} style={{ width: '100%', fontSize: 18, fontWeight: '800', padding: '12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(245,245,245,0.8)', fontFamily: 'system-ui', boxSizing: 'border-box' as any }} /></div>
              {activeCat === 'medication' && <div style={{ marginBottom: 12 }}><div style={{ fontSize: 11, fontWeight: '700', color: '#6B7280', marginBottom: 6, textTransform: 'uppercase' as any, letterSpacing: 1 }}>Dosage</div><input type="text" placeholder="1 comprime" value={fDosage} onChange={(e: any) => setFDosage(e.target.value)} style={{ width: '100%', fontSize: 15, padding: '12px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.10)', background: 'rgba(245,245,245,0.8)', fontFamily: 'system-ui', boxSizing: 'border-box' as any }} /></div>}
            </>)}
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 16, justifyContent: 'center' }}>
              {DAYS.map(d => (
                <TouchableOpacity key={d.key} style={[{ width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: fDays.includes(d.key) ? '#000' : '#DDD' }, fDays.includes(d.key) && { backgroundColor: '#FFFFFF' }]}
                  onPress={() => setFDays(prev => prev.includes(d.key) ? prev.filter(x => x !== d.key) : [...prev, d.key])}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: fDays.includes(d.key) ? '#FFF' : '#888' }}>{d.s}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity style={{ flex: 1, paddingVertical: 14, borderRadius: 9999, backgroundColor: '#F5F5F5', alignItems: 'center' }} onPress={() => setShowModal(false)}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#6B7280' }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, paddingVertical: 14, borderRadius: 9999, backgroundColor: '#FFFFFF', alignItems: 'center' }} onPress={save} disabled={saving}>
                {saving ? <ActivityIndicator color="#111827" size="small" /> : <Text style={{ fontSize: 14, fontWeight: '800', color: '#FFF' }}>{editR ? 'MODIFIER' : 'CREER'}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
