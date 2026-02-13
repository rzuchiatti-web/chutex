import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, Switch, Platform, Image } from 'react-native';
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

export default function RemindersScreen() {
  const { colors } = useTheme();
  const { token } = useAuth();
  const router = useRouter();
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedType, setSelectedType] = useState('hydration');
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('08:00');
  const [dosage, setDosage] = useState('');
  const [interval_, setInterval_] = useState('120');
  const [selectedDays, setSelectedDays] = useState(['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim']);
  const [saving, setSaving] = useState(false);

  const fetchReminders = useCallback(async () => {
    try { setReminders(await apiFetch('/api/reminders', {}, token)); } catch {} finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchReminders(); }, [fetchReminders]);

  const createReminder = async () => {
    if (!title.trim()) return Alert.alert('Erreur', 'Titre requis');
    setSaving(true);
    try {
      await apiFetch('/api/reminders', { method: 'POST', body: JSON.stringify({ reminder_type: selectedType, title: title.trim(), time, days: selectedDays, dosage, interval_minutes: selectedType === 'hydration' ? parseInt(interval_) || 120 : 0 }) }, token);
      setShowModal(false); setTitle(''); setDosage(''); fetchReminders();
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

  if (loading) return <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}><ActivityIndicator size="large" color="#000" /></SafeAreaView>;

  const activeCat = activeCategory ? CATEGORIES.find(c => c.key === activeCategory) : null;
  const catReminders = activeCat ? reminders.filter(r => activeCat.types.includes(r.reminder_type)) : [];

  // Category list view
  if (!activeCategory) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 4, marginRight: 12 }}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={{ flex: 1, fontSize: 22, fontWeight: '900', color: '#000' }}>Mes rappels</Text>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
          {CATEGORIES.map(cat => {
            const items = reminders.filter(r => cat.types.includes(r.reminder_type));
            return (
              <TouchableOpacity key={cat.key} onPress={() => setActiveCategory(cat.key)} activeOpacity={0.7}>
                <View style={[{ backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', padding: 18, marginBottom: 12, flexDirection: 'row', alignItems: 'center', ...glass }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 18, fontWeight: '800', color: '#000' }}>{cat.label}</Text>
                    <Text style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{items.length} rappel{items.length !== 1 ? 's' : ''} par jour</Text>
                    <Text style={{ fontSize: 13, fontWeight: '800', color: '#000', marginTop: 10, textTransform: 'uppercase' }}>TEMPS RESTANT | --:--</Text>
                  </View>
                  <Image source={{ uri: REMINDER_IMAGES[cat.key] }} style={{ width: 60, height: 60, resizeMode: 'contain' }} />
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Category detail view
  const catImg = REMINDER_IMAGES[activeCategory];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14 }}>
        <TouchableOpacity onPress={() => setActiveCategory(null)} style={{ padding: 4, marginRight: 12 }}>
          <Ionicons name="chevron-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={{ flex: 1, fontSize: 22, fontWeight: '900', color: '#000' }}>{activeCat?.label}</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        {/* Category illustration */}
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <Image source={{ uri: catImg }} style={{ width: 100, height: 100, resizeMode: 'contain' }} />
        </View>

        {/* Reminder entries */}
        {catReminders.map(r => (
          <View key={r.id} style={[{ backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 18, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', padding: 16, marginBottom: 10, ...glass }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View>
                <Text style={{ fontSize: 28, fontWeight: '900', color: '#000' }}>{r.time}</Text>
                <Text style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
                  {r.days?.length === 7 ? 'Tous les jours' : r.days?.map((d: string) => {
                    const day = DAYS_FULL.find(df => df.key === d);
                    return day?.label?.substring(0, 3) || d;
                  }).join(', ')}
                </Text>
                {r.dosage ? <Text style={{ fontSize: 12, color: '#888' }}>{r.dosage}</Text> : null}
              </View>
              <Switch value={r.active} onValueChange={() => toggleActive(r.id)} trackColor={{ true: '#4CAF50', false: '#DDD' }} />
            </View>

            {/* Day frequency selector */}
            <View style={{ marginTop: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#000', marginBottom: 8 }}>Definir la frequence</Text>
              {DAYS_FULL.map(d => (
                <View key={d.key} style={[{ backgroundColor: 'rgba(255,255,255,0.5)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 4, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', ...glass }]}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#000', textTransform: 'uppercase', letterSpacing: 0.5 }}>{d.label}</Text>
                  {r.days?.includes(d.key) && <Ionicons name="checkmark" size={18} color="#000" />}
                </View>
              ))}
            </View>
          </View>
        ))}

        {catReminders.length === 0 && (
          <View style={{ alignItems: 'center', padding: 32 }}>
            <Text style={{ fontSize: 14, color: '#888' }}>Aucun rappel dans cette categorie</Text>
          </View>
        )}

        {/* Add reminder button */}
        <TouchableOpacity data-testid="add-reminder-btn" style={{ backgroundColor: '#000', borderRadius: 9999, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16, ...(Platform.OS === 'web' ? { boxShadow: '0 4px 16px rgba(0,0,0,0.15)' } : {}) }} onPress={() => { setSelectedType(activeCategory === 'alarm' ? 'alarm' : activeCategory); setShowModal(true); }}>
          <Text style={{ color: '#FFF', fontSize: 15, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1 }}>AJOUTER UN RAPPEL</Text>
          <Ionicons name="heart-outline" size={18} color="#FFF" />
        </TouchableOpacity>
      </ScrollView>

      {/* Create Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: '#000', marginBottom: 16 }}>Nouveau rappel</Text>

            {Platform.OS === 'web' ? (
              <>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: '700', color: '#888', marginBottom: 6, textTransform: 'uppercase' as any, letterSpacing: 1 }}>Titre</div>
                  <input data-testid="reminder-title-input" type="text" placeholder="Ex: Prendre Doliprane" value={title} onChange={(e: any) => setTitle(e.target.value)}
                    style={{ width: '100%', fontSize: 15, padding: '14px', borderRadius: 14, border: '1.5px solid rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.6)', fontFamily: 'system-ui', boxSizing: 'border-box' as any }} />
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: '700', color: '#888', marginBottom: 6, textTransform: 'uppercase' as any, letterSpacing: 1 }}>Heure</div>
                  <input type="time" value={time} onChange={(e: any) => setTime(e.target.value)}
                    style={{ width: '100%', fontSize: 15, padding: '14px', borderRadius: 14, border: '1.5px solid rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.6)', fontFamily: 'system-ui', boxSizing: 'border-box' as any }} />
                </div>
                {activeCategory === 'medication' && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: '700', color: '#888', marginBottom: 6, textTransform: 'uppercase' as any, letterSpacing: 1 }}>Dosage</div>
                    <input type="text" placeholder="1 comprime" value={dosage} onChange={(e: any) => setDosage(e.target.value)}
                      style={{ width: '100%', fontSize: 15, padding: '14px', borderRadius: 14, border: '1.5px solid rgba(0,0,0,0.08)', background: 'rgba(255,255,255,0.6)', fontFamily: 'system-ui', boxSizing: 'border-box' as any }} />
                  </div>
                )}
              </>
            ) : (
              <>
                <TextInput placeholder="Titre du rappel" placeholderTextColor="#999" value={title} onChangeText={setTitle}
                  style={{ backgroundColor: 'rgba(245,245,245,0.8)', borderRadius: 14, padding: 14, fontSize: 15, color: '#000', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' }} />
                <TextInput placeholder="Heure (HH:MM)" placeholderTextColor="#999" value={time} onChangeText={setTime}
                  style={{ backgroundColor: 'rgba(245,245,245,0.8)', borderRadius: 14, padding: 14, fontSize: 15, color: '#000', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(0,0,0,0.08)' }} />
              </>
            )}

            {/* Days */}
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: 16, justifyContent: 'center' }}>
              {DAYS_FULL.map(d => (
                <TouchableOpacity key={d.key} style={[{ width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 1.5, borderColor: selectedDays.includes(d.key) ? '#000' : '#DDD' }, selectedDays.includes(d.key) && { backgroundColor: '#000' }]}
                  onPress={() => setSelectedDays(prev => prev.includes(d.key) ? prev.filter(x => x !== d.key) : [...prev, d.key])}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: selectedDays.includes(d.key) ? '#FFF' : '#888' }}>{d.label.substring(0, 2)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity style={{ flex: 1, paddingVertical: 14, borderRadius: 9999, backgroundColor: '#F5F5F5', alignItems: 'center' }} onPress={() => setShowModal(false)}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#888' }}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity data-testid="save-reminder-btn" style={{ flex: 1, paddingVertical: 14, borderRadius: 9999, backgroundColor: '#000', alignItems: 'center' }} onPress={createReminder} disabled={saving}>
                {saving ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={{ fontSize: 15, fontWeight: '800', color: '#FFF' }}>CREER</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
