import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, Alert, ActivityIndicator, Switch, Platform, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';
import { apiFetch } from '../src/services/api';
import { useRouter } from 'expo-router';

const REMINDER_IMAGES: Record<string, string> = {
  hydration: 'https://customer-assets.emergentagent.com/job_1026023a-fd73-4c44-a002-9618d437c4c8/artifacts/22914qql_rappels_hydratation.svg',
  medication: 'https://customer-assets.emergentagent.com/job_1026023a-fd73-4c44-a002-9618d437c4c8/artifacts/kmlx8iu2_ChatGPT%20Image%2026%20nov.%202025%2C%2010_04_44.png',
  alarm: 'https://customer-assets.emergentagent.com/job_1026023a-fd73-4c44-a002-9618d437c4c8/artifacts/o8lth2ng_ChatGPT%20Image%2026%20nov.%202025%2C%2010_07_27.png',
};

const CATEGORIES = [
  { key: 'hydration', label: 'Hydratation', types: ['hydration'] },
  { key: 'medication', label: 'Traitements', types: ['medication'] },
  { key: 'alarm', label: 'Alarmes quotidiennes', types: ['alarm', 'custom'] },
];

const DAYS_FULL = [
  { key: 'lun', label: 'LUNDI' }, { key: 'mar', label: 'MARDI' }, { key: 'mer', label: 'MERCREDI' },
  { key: 'jeu', label: 'JEUDI' }, { key: 'ven', label: 'VENDREDI' }, { key: 'sam', label: 'SAMEDI' }, { key: 'dim', label: 'DIMANCHE' },
];

const glass = Platform.OS === 'web' ? { backdropFilter: 'blur(40px)', WebkitBackdropFilter: 'blur(40px)', boxShadow: '0 8px 32px rgba(0,0,0,0.04), inset 0 0 0 0.5px rgba(255,255,255,0.6)' } : {};
const GlassCard = ({ children, style }: any) => (
  <View style={[{ backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', padding: 18, marginBottom: 12, ...glass }, style]}>{children}</View>
);

function getTimeRemaining(reminders: any[]): string {
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const dayMap: Record<string, number> = { dim: 0, lun: 1, mar: 2, mer: 3, jeu: 4, ven: 5, sam: 6 };
  const today = now.getDay();
  let closest = Infinity;
  for (const r of reminders) {
    if (!r.active || !r.time) continue;
    const [h, m] = r.time.split(':').map(Number);
    const rMin = h * 60 + m;
    const days = r.days || [];
    for (const d of days) {
      const dayNum = dayMap[d];
      if (dayNum === undefined) continue;
      let diff = (dayNum - today + 7) % 7;
      let totalMin = diff * 1440 + (rMin - nowMin);
      if (totalMin <= 0) totalMin += 7 * 1440;
      if (totalMin < closest) closest = totalMin;
    }
    if (days.length === 0) {
      let diff = rMin - nowMin;
      if (diff <= 0) diff += 1440;
      if (diff < closest) closest = diff;
    }
  }
  if (closest === Infinity) return '--:--';
  const hrs = Math.floor(closest / 60);
  const mins = closest % 60;
  return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

export default function RemindersScreen() {
  const { colors } = useTheme();
  const { token } = useAuth();
  const router = useRouter();
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [editingReminder, setEditingReminder] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [formTitle, setFormTitle] = useState('');
  const [formTime, setFormTime] = useState('08:00');
  const [formDosage, setFormDosage] = useState('');
  const [formDays, setFormDays] = useState(['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim']);
  const [saving, setSaving] = useState(false);

  const fetchReminders = useCallback(async () => {
    try { setReminders(await apiFetch('/api/reminders', {}, token)); } catch {} finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchReminders(); }, [fetchReminders]);

  const openCreate = (type: string) => {
    setEditingReminder(null);
    setFormTitle(''); setFormTime('08:00'); setFormDosage(''); setFormDays(['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim']);
    setShowModal(true);
  };

  const openEdit = (r: any) => {
    setEditingReminder(r);
    setFormTitle(r.title || ''); setFormTime(r.time || '08:00'); setFormDosage(r.dosage || '');
    setFormDays(r.days || ['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim']);
    setShowModal(true);
  };

  const saveReminder = async () => {
    if (!formTitle.trim()) return Alert.alert('Erreur', 'Titre requis');
    setSaving(true);
    try {
      if (editingReminder) {
        await apiFetch(`/api/reminders/${editingReminder.id}`, { method: 'PUT', body: JSON.stringify({ title: formTitle.trim(), time: formTime, days: formDays, dosage: formDosage }) }, token);
      } else {
        const type = activeCategory === 'medication' ? 'medication' : activeCategory === 'hydration' ? 'hydration' : 'alarm';
        await apiFetch('/api/reminders', { method: 'POST', body: JSON.stringify({ reminder_type: type, title: formTitle.trim(), time: formTime, days: formDays, dosage: formDosage, interval_minutes: type === 'hydration' ? 120 : 0 }) }, token);
      }
      setShowModal(false); fetchReminders();
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setSaving(false); }
  };

  const toggleActive = async (rid: string) => {
    try { await apiFetch(`/api/reminders/${rid}/toggle`, { method: 'PUT' }, token); fetchReminders(); } catch {}
  };

  const deleteReminder = (rid: string) => {
    Alert.alert('Supprimer', 'Supprimer ce rappel ?', [
      { text: 'Annuler' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => { await apiFetch(`/api/reminders/${rid}`, { method: 'DELETE' }, token); fetchReminders(); } }
    ]);
  };

  const toggleDay = (d: string) => setFormDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);

  if (loading) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#000" /></SafeAreaView>;

  const activeCat = activeCategory ? CATEGORIES.find(c => c.key === activeCategory) : null;
  const catReminders = activeCat ? reminders.filter(r => activeCat.types.includes(r.reminder_type)) : [];

  // Category list view
  if (!activeCategory) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4, marginRight: 12 }}><Ionicons name="chevron-back" size={24} color="#000" /></TouchableOpacity>
          <Text style={{ flex: 1, fontSize: 22, fontWeight: '900', color: '#000' }}>Mes rappels</Text>
        </View>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
          {CATEGORIES.map(cat => {
            const items = reminders.filter(r => cat.types.includes(r.reminder_type));
            const activeItems = items.filter(r => r.active);
            const timeLeft = getTimeRemaining(activeItems);
            return (
              <TouchableOpacity key={cat.key} onPress={() => setActiveCategory(cat.key)} activeOpacity={0.7}>
                <GlassCard style={{ flexDirection: 'row', alignItems: 'center', padding: 18 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: '#000' }}>{cat.label}</Text>
                    <Text style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{items.length} rappel{items.length !== 1 ? 's' : ''} par jour</Text>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#000', marginTop: 10, textTransform: 'uppercase' }}>TEMPS RESTANT | {timeLeft}</Text>
                  </View>
                  <Image source={{ uri: REMINDER_IMAGES[cat.key] }} style={{ width: 60, height: 60, resizeMode: 'contain' }} />
                </GlassCard>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Category detail view
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
        <TouchableOpacity onPress={() => setActiveCategory(null)} style={{ padding: 4, marginRight: 12 }}><Ionicons name="chevron-back" size={24} color="#000" /></TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 22, fontWeight: '900', color: '#000' }}>{activeCat?.label}</Text>
      </View>
      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <Image source={{ uri: REMINDER_IMAGES[activeCategory] }} style={{ width: 80, height: 80, resizeMode: 'contain' }} />
        </View>

        {catReminders.map(r => (
          <GlassCard key={r.id} style={{ opacity: r.active ? 1 : 0.5 }}>
            {/* Time + Toggle */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <TouchableOpacity onPress={() => openEdit(r)} style={{ flex: 1 }}>
                <Text style={{ fontSize: 32, fontWeight: '900', color: '#000' }}>{r.time}</Text>
                <Text style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                  {r.days?.length === 7 ? 'Tous les jours' : r.days?.map((d: string) => DAYS_FULL.find(df => df.key === d)?.label?.substring(0, 3) || d).join(', ')}
                </Text>
                {r.title && <Text style={{ fontSize: 13, fontWeight: '600', color: '#000', marginTop: 4 }}>{r.title}</Text>}
                {r.dosage && <Text style={{ fontSize: 12, color: '#888' }}>{r.dosage}</Text>}
              </TouchableOpacity>
              <View style={{ alignItems: 'center', gap: 8 }}>
                <Switch value={r.active} onValueChange={() => toggleActive(r.id)} trackColor={{ true: '#4CAF50', false: '#DDD' }} />
                <TouchableOpacity onPress={() => deleteReminder(r.id)} style={{ padding: 4 }}>
                  <Ionicons name="trash-outline" size={18} color="#E53935" />
                </TouchableOpacity>
              </View>
            </View>
          </GlassCard>
        ))}

        {catReminders.length === 0 && (
          <GlassCard style={{ alignItems: 'center', padding: 32 }}>
            <Text style={{ fontSize: 14, color: '#888' }}>Aucun rappel dans cette categorie</Text>
          </GlassCard>
        )}

        <TouchableOpacity style={{ backgroundColor: '#000', borderRadius: 9999, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 8, ...(Platform.OS === 'web' ? { boxShadow: '0 4px 16px rgba(0,0,0,0.15)' } : {}) }} onPress={() => openCreate(activeCategory)}>
          <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>AJOUTER UN RAPPEL</Text>
          <Ionicons name="heart-outline" size={18} color="#FFF" />
        </TouchableOpacity>
      </ScrollView>

      {/* Create/Edit Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: '#000', marginBottom: 16 }}>{editingReminder ? 'Modifier le rappel' : 'Nouveau rappel'}</Text>

            {Platform.OS === 'web' ? (
              <>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: '700', color: '#888', marginBottom: 6, textTransform: 'uppercase' as any, letterSpacing: 1 }}>Titre</div>
                  <input type="text" placeholder="Ex: Boire 1 verre d'eau" value={formTitle} onChange={(e: any) => setFormTitle(e.target.value)}
                    style={{ width: '100%', fontSize: 15, padding: '14px', borderRadius: 14, border: '1.5px solid rgba(0,0,0,0.08)', background: 'rgba(245,245,245,0.8)', fontFamily: 'system-ui', boxSizing: 'border-box' as any }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: '700', color: '#888', marginBottom: 6, textTransform: 'uppercase' as any, letterSpacing: 1 }}>Heure</div>
                  <input type="time" value={formTime} onChange={(e: any) => setFormTime(e.target.value)}
                    style={{ width: '100%', fontSize: 18, fontWeight: '800', padding: '14px', borderRadius: 14, border: '1.5px solid rgba(0,0,0,0.08)', background: 'rgba(245,245,245,0.8)', fontFamily: 'system-ui', boxSizing: 'border-box' as any }} />
                </div>
                {activeCategory === 'medication' && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: '700', color: '#888', marginBottom: 6, textTransform: 'uppercase' as any, letterSpacing: 1 }}>Dosage</div>
                    <input type="text" placeholder="1 comprime" value={formDosage} onChange={(e: any) => setFormDosage(e.target.value)}
                      style={{ width: '100%', fontSize: 15, padding: '14px', borderRadius: 14, border: '1.5px solid rgba(0,0,0,0.08)', background: 'rgba(245,245,245,0.8)', fontFamily: 'system-ui', boxSizing: 'border-box' as any }} />
                  </div>
                )}
              </>
            ) : null}

            <Text style={{ fontSize: 14, fontWeight: '800', color: '#000', marginBottom: 8 }}>Definir la frequence</Text>
            {DAYS_FULL.map(d => (
              <TouchableOpacity key={d.key} style={[{ backgroundColor: 'rgba(245,245,245,0.8)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1.5, borderColor: formDays.includes(d.key) ? '#000' : 'rgba(0,0,0,0.06)' }]} onPress={() => toggleDay(d.key)}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#000', textTransform: 'uppercase', letterSpacing: 0.5 }}>{d.label}</Text>
                {formDays.includes(d.key) && <Ionicons name="checkmark" size={18} color="#000" />}
              </TouchableOpacity>
            ))}

            <View style={{ flexDirection: 'row', gap: 12, marginTop: 14 }}>
              <TouchableOpacity style={{ flex: 1, paddingVertical: 14, borderRadius: 9999, backgroundColor: '#F5F5F5', alignItems: 'center' }} onPress={() => setShowModal(false)}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#888' }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity style={{ flex: 1, paddingVertical: 14, borderRadius: 9999, backgroundColor: '#000', alignItems: 'center' }} onPress={saveReminder} disabled={saving}>
                {saving ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={{ fontSize: 15, fontWeight: '800', color: '#FFF' }}>{editingReminder ? 'MODIFIER' : 'CREER'}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
