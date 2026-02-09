import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, SafeAreaView, ActivityIndicator, Switch, Platform, KeyboardAvoidingView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { apiFetch } from '../src/services/api';
import { Colors } from '../src/constants/colors';
import { useRouter } from 'expo-router';

const TYPES = [
  { key: 'hydration', label: 'Hydratation', icon: 'water-outline', color: '#2196F3' },
  { key: 'medication', label: 'Médicament', icon: 'medkit-outline', color: '#E91E63' },
  { key: 'alarm', label: 'Activité', icon: 'alarm-outline', color: '#FF9800' },
  { key: 'custom', label: 'Personnalisé', icon: 'create-outline', color: '#9C27B0' },
];
const DAYS = [
  { key: 'lun', label: 'L' }, { key: 'mar', label: 'M' }, { key: 'mer', label: 'Me' },
  { key: 'jeu', label: 'J' }, { key: 'ven', label: 'V' }, { key: 'sam', label: 'S' }, { key: 'dim', label: 'D' },
];

export default function RemindersScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedType, setSelectedType] = useState('hydration');
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('08:00');
  const [dosage, setDosage] = useState('');
  const [notes, setNotes] = useState('');
  const [interval, setInterval_] = useState('120');
  const [selectedDays, setSelectedDays] = useState(['lun','mar','mer','jeu','ven','sam','dim']);
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().split('T')[0];

  const fetchReminders = useCallback(async () => {
    try { setReminders(await apiFetch('/api/reminders', {}, token)); } catch {} finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchReminders(); }, [fetchReminders]);

  const createReminder = async () => {
    if (!title.trim()) return Alert.alert('Erreur', 'Titre requis');
    setSaving(true);
    try {
      await apiFetch('/api/reminders', {
        method: 'POST',
        body: JSON.stringify({
          reminder_type: selectedType, title: title.trim(), time,
          days: selectedDays, notes, dosage,
          interval_minutes: selectedType === 'hydration' ? parseInt(interval) || 120 : 0,
        })
      }, token);
      setShowModal(false); setTitle(''); setDosage(''); setNotes('');
      fetchReminders();
    } catch (e: any) { Alert.alert('Erreur', e.message); } finally { setSaving(false); }
  };

  const toggleComplete = async (rid: string) => {
    try {
      await apiFetch(`/api/reminders/${rid}/complete`, { method: 'PUT' }, token);
      fetchReminders();
    } catch {}
  };

  const toggleActive = async (rid: string) => {
    try {
      await apiFetch(`/api/reminders/${rid}/toggle`, { method: 'PUT' }, token);
      fetchReminders();
    } catch {}
  };

  const deleteReminder = (rid: string) => {
    Alert.alert('Supprimer', 'Supprimer ce rappel ?', [
      { text: 'Annuler' },
      { text: 'Supprimer', style: 'destructive', onPress: async () => {
        await apiFetch(`/api/reminders/${rid}`, { method: 'DELETE' }, token);
        fetchReminders();
      }}
    ]);
  };

  const toggleDay = (day: string) => {
    setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const isCompleted = (r: any) => r.completions?.includes(today);
  const typeInfo = (t: string) => TYPES.find(x => x.key === t) || TYPES[3];

  if (loading) return <SafeAreaView style={s.c}><ActivityIndicator size="large" color={Colors.primary} /></SafeAreaView>;

  const grouped = {
    hydration: reminders.filter(r => r.reminder_type === 'hydration'),
    medication: reminders.filter(r => r.reminder_type === 'medication'),
    alarm: reminders.filter(r => r.reminder_type === 'alarm'),
    custom: reminders.filter(r => r.reminder_type === 'custom'),
  };

  return (
    <SafeAreaView style={s.c}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text} />
        </TouchableOpacity>
        <Text style={s.headerT}>Mes rappels</Text>
        <TouchableOpacity data-testid="add-reminder-btn" style={s.addBtn} onPress={() => setShowModal(true)}>
          <Ionicons name="add" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Summary cards */}
        <View style={s.summaryRow}>
          {TYPES.map(t => {
            const items = grouped[t.key as keyof typeof grouped] || [];
            const done = items.filter(r => isCompleted(r)).length;
            return (
              <View key={t.key} style={[s.summaryCard, { borderLeftColor: t.color }]}>
                <Ionicons name={t.icon as any} size={20} color={t.color} />
                <Text style={s.summaryCount}>{done}/{items.length}</Text>
                <Text style={s.summaryLabel}>{t.label}</Text>
              </View>
            );
          })}
        </View>

        {/* Reminders list by type */}
        {TYPES.map(t => {
          const items = grouped[t.key as keyof typeof grouped] || [];
          if (items.length === 0) return null;
          return (
            <View key={t.key} style={s.section}>
              <View style={s.sectionHeader}>
                <Ionicons name={t.icon as any} size={18} color={t.color} />
                <Text style={[s.sectionTitle, { color: t.color }]}>{t.label}</Text>
              </View>
              {items.map(r => (
                <View key={r.id} style={[s.reminderCard, !r.active && { opacity: 0.4 }]}>
                  <TouchableOpacity
                    data-testid={`complete-${r.id}`}
                    style={[s.checkCircle, isCompleted(r) && { backgroundColor: t.color, borderColor: t.color }]}
                    onPress={() => toggleComplete(r.id)}
                  >
                    {isCompleted(r) && <Ionicons name="checkmark" size={14} color="#FFF" />}
                  </TouchableOpacity>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.reminderTitle, isCompleted(r) && { textDecorationLine: 'line-through', color: Colors.textMuted }]}>{r.title}</Text>
                    <Text style={s.reminderMeta}>
                      {r.time} {r.dosage ? ` - ${r.dosage}` : ''}
                      {r.interval_minutes > 0 ? ` - Toutes les ${r.interval_minutes}min` : ''}
                    </Text>
                    <View style={s.daysRow}>
                      {DAYS.map(d => (
                        <View key={d.key} style={[s.dayBadge, r.days?.includes(d.key) && { backgroundColor: t.color }]}>
                          <Text style={[s.dayText, r.days?.includes(d.key) && { color: '#FFF' }]}>{d.label}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                  <View style={s.reminderActions}>
                    <Switch value={r.active} onValueChange={() => toggleActive(r.id)} trackColor={{ true: t.color }} />
                    <TouchableOpacity onPress={() => deleteReminder(r.id)} style={{ marginTop: 6 }}>
                      <Ionicons name="trash-outline" size={16} color={Colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          );
        })}

        {reminders.length === 0 && (
          <View style={s.empty}>
            <Ionicons name="alarm-outline" size={48} color={Colors.textMuted} />
            <Text style={s.emptyText}>Aucun rappel configuré</Text>
            <Text style={s.emptyDesc}>Ajoutez vos rappels d'hydratation, médicaments et activités quotidiennes</Text>
          </View>
        )}
      </ScrollView>

      {/* Create Reminder Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.modalO}>
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={s.modalO}>
              <TouchableWithoutFeedback>
                <View style={s.modalC}>
                  <Text style={s.modalTitle}>Nouveau rappel</Text>

                  {/* Type selection */}
                  <View style={s.typeRow}>
                    {TYPES.map(t => (
                      <TouchableOpacity
                        key={t.key}
                        style={[s.typeBtn, selectedType === t.key && { backgroundColor: t.color, borderColor: t.color }]}
                        onPress={() => setSelectedType(t.key)}
                      >
                        <Ionicons name={t.icon as any} size={18} color={selectedType === t.key ? '#FFF' : Colors.text} />
                        <Text style={[s.typeBtnT, selectedType === t.key && { color: '#FFF' }]}>{t.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TextInput style={s.input} placeholder="Titre du rappel" placeholderTextColor={Colors.textMuted}
                    value={title} onChangeText={setTitle} blurOnSubmit={false} />
                  <TextInput style={s.input} placeholder="Heure (HH:MM)" placeholderTextColor={Colors.textMuted}
                    value={time} onChangeText={setTime} blurOnSubmit={false} />
                  {selectedType === 'medication' && (
                    <TextInput style={s.input} placeholder="Dosage (ex: 1 comprimé)" placeholderTextColor={Colors.textMuted}
                      value={dosage} onChangeText={setDosage} blurOnSubmit={false} />
                  )}
                  {selectedType === 'hydration' && (
                    <TextInput style={s.input} placeholder="Intervalle (minutes)" placeholderTextColor={Colors.textMuted}
                      value={interval} onChangeText={setInterval_} keyboardType="numeric" blurOnSubmit={false} />
                  )}
                  <TextInput style={s.input} placeholder="Notes (optionnel)" placeholderTextColor={Colors.textMuted}
                    value={notes} onChangeText={setNotes} blurOnSubmit={false} />

                  {/* Days selection */}
                  <View style={s.daysSelect}>
                    {DAYS.map(d => (
                      <TouchableOpacity
                        key={d.key}
                        style={[s.daySelectBtn, selectedDays.includes(d.key) && { backgroundColor: Colors.primary }]}
                        onPress={() => toggleDay(d.key)}
                      >
                        <Text style={[s.daySelectT, selectedDays.includes(d.key) && { color: '#FFF' }]}>{d.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={s.modalBtns}>
                    <TouchableOpacity style={s.cancelBtn} onPress={() => setShowModal(false)}>
                      <Text style={s.cancelBtnT}>Annuler</Text>
                    </TouchableOpacity>
                    <TouchableOpacity data-testid="save-reminder-btn" style={s.saveBtn} onPress={createReminder} disabled={saving}>
                      {saving ? <ActivityIndicator color="#FFF" size="small" /> : <Text style={s.saveBtnT}>Créer</Text>}
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: Colors.background },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 0.5, borderBottomColor: Colors.border, backgroundColor: Colors.paper },
  backBtn: { padding: 4, marginRight: 12 },
  headerT: { flex: 1, fontSize: 18, fontWeight: '700', color: Colors.text, letterSpacing: 0.5 },
  addBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  scroll: { flex: 1 },
  summaryRow: { flexDirection: 'row', padding: 12, gap: 8 },
  summaryCard: { flex: 1, backgroundColor: Colors.paper, padding: 12, borderRadius: 10, borderLeftWidth: 3, alignItems: 'center', gap: 4 },
  summaryCount: { fontSize: 18, fontWeight: '700', color: Colors.text },
  summaryLabel: { fontSize: 10, color: Colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  section: { marginBottom: 16 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  reminderCard: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: Colors.paper, marginHorizontal: 12, marginBottom: 6, borderRadius: 10, gap: 12 },
  checkCircle: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  reminderTitle: { fontSize: 15, fontWeight: '600', color: Colors.text },
  reminderMeta: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  daysRow: { flexDirection: 'row', gap: 3, marginTop: 6 },
  dayBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: Colors.subtle, justifyContent: 'center', alignItems: 'center' },
  dayText: { fontSize: 9, fontWeight: '600', color: Colors.textMuted },
  reminderActions: { alignItems: 'center' },
  empty: { alignItems: 'center', padding: 40, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '600', color: Colors.text },
  emptyDesc: { fontSize: 13, color: Colors.textMuted, textAlign: 'center' },
  modalO: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalC: { backgroundColor: Colors.paper, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '85%' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 16 },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  typeBtn: { flex: 1, flexDirection: 'column', alignItems: 'center', padding: 10, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border, gap: 4 },
  typeBtnT: { fontSize: 10, fontWeight: '600', color: Colors.text },
  input: { backgroundColor: Colors.subtle, borderRadius: 10, padding: 14, fontSize: 15, color: Colors.text, marginBottom: 10, borderWidth: 1, borderColor: Colors.border },
  daysSelect: { flexDirection: 'row', gap: 6, marginBottom: 16, justifyContent: 'center' },
  daySelectBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.subtle, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  daySelectT: { fontSize: 12, fontWeight: '600', color: Colors.text },
  modalBtns: { flexDirection: 'row', gap: 12 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  cancelBtnT: { fontSize: 15, color: Colors.textMuted, fontWeight: '600' },
  saveBtn: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center' },
  saveBtnT: { fontSize: 15, color: '#FFF', fontWeight: '600' },
});
