import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Platform, TextInput, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const glass = Platform.OS === 'web' ? { backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' } : {};
const { width: SCREEN_W } = Dimensions.get('window');

/* ===== HELP BUBBLE - "?" button that shows contextual help ===== */
export function HelpBubble({ id, title, description, steps }: { id: string; title: string; description: string; steps?: string[] }) {
  const [show, setShow] = useState(false);
  return (
    <>
      <TouchableOpacity onPress={() => setShow(true)} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(33,150,243,0.1)', justifyContent: 'center', alignItems: 'center' }} data-testid={`help-${id}`}>
        <Ionicons name="help-circle" size={18} color="#2196F3" />
      </TouchableOpacity>
      <Modal visible={show} transparent animationType="fade">
        <TouchableOpacity activeOpacity={1} onPress={() => setShow(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}} style={{ backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '70%' }}>
            <View style={{ alignItems: 'center', paddingBottom: 8 }}><View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#DDD' }} /></View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="information-circle" size={22} color="#2196F3" />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#000', flex: 1 }}>{title}</Text>
              <TouchableOpacity onPress={() => setShow(false)}><Ionicons name="close" size={22} color="#888" /></TouchableOpacity>
            </View>
            <Text style={{ fontSize: 14, color: '#555', lineHeight: 22, marginBottom: 16 }}>{description}</Text>
            {steps && steps.length > 0 && (
              <View style={{ gap: 10 }}>
                {steps.map((s, i) => (
                  <View key={i} style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: '#2196F3', justifyContent: 'center', alignItems: 'center' }}>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFF' }}>{i + 1}</Text>
                    </View>
                    <Text style={{ fontSize: 13, color: '#333', lineHeight: 20, flex: 1 }}>{s}</Text>
                  </View>
                ))}
              </View>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

/* ===== CONTEXTUAL TIP - shown once, dismissible ===== */
export function ContextualTip({ id, icon, text, color }: { id: string; icon?: string; text: string; color?: string }) {
  const [visible, setVisible] = useState(false);
  const storageKey = `tip_dismissed_${id}`;
  useEffect(() => {
    AsyncStorage.getItem(storageKey).then(v => { if (!v) setVisible(true); });
  }, []);
  const dismiss = () => { setVisible(false); AsyncStorage.setItem(storageKey, 'true'); };
  if (!visible) return null;
  const c = color || '#2196F3';
  return (
    <View style={{ backgroundColor: c + '08', borderRadius: 14, padding: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 1, borderColor: c + '20' }}>
      <Ionicons name={(icon || 'bulb-outline') as any} size={18} color={c} style={{ marginTop: 1 }} />
      <Text style={{ fontSize: 13, color: '#333', lineHeight: 19, flex: 1 }}>{text}</Text>
      <TouchableOpacity onPress={dismiss} style={{ padding: 2 }}><Ionicons name="close" size={16} color="#AAA" /></TouchableOpacity>
    </View>
  );
}

/* ===== ACTION FEEDBACK - toast-like confirmation ===== */
export function ActionFeedback({ message, type, visible, onDismiss }: { message: string; type: 'success' | 'info' | 'warning'; visible: boolean; onDismiss: () => void }) {
  useEffect(() => { if (visible) { const t = setTimeout(onDismiss, 3500); return () => clearTimeout(t); } }, [visible]);
  if (!visible) return null;
  const cfg = { success: { bg: '#4CAF50', icon: 'checkmark-circle' }, info: { bg: '#2196F3', icon: 'information-circle' }, warning: { bg: '#FF9800', icon: 'warning' } }[type];
  return (
    <View style={{ position: 'absolute', top: 60, left: 16, right: 16, backgroundColor: cfg.bg, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10, zIndex: 99999, ...(Platform.OS === 'web' ? { boxShadow: '0 4px 20px rgba(0,0,0,0.2)' } : {}) }}>
      <Ionicons name={cfg.icon as any} size={20} color="#FFF" />
      <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFF', flex: 1 }}>{message}</Text>
      <TouchableOpacity onPress={onDismiss}><Ionicons name="close" size={18} color="rgba(255,255,255,0.7)" /></TouchableOpacity>
    </View>
  );
}

/* ===== ONBOARDING CHECKLIST - progressive setup guide ===== */
export function OnboardingChecklist({ items, title }: { items: { label: string; done: boolean; action?: () => void }[]; title: string }) {
  const completed = items.filter(i => i.done).length;
  const total = items.length;
  if (completed === total) return null;
  const pct = (completed / total) * 100;
  return (
    <View style={{ backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', padding: 18, marginBottom: 12, ...glass }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="rocket-outline" size={18} color="#2196F3" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: '#000' }}>{title}</Text>
          <Text style={{ fontSize: 11, color: '#888' }}>{completed}/{total} etapes completees</Text>
        </View>
      </View>
      <View style={{ height: 6, backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 3, marginBottom: 12, overflow: 'hidden' }}>
        <View style={{ height: 6, backgroundColor: '#2196F3', borderRadius: 3, width: `${pct}%` }} />
      </View>
      {items.map((item, i) => (
        <TouchableOpacity key={i} disabled={item.done || !item.action} onPress={item.action}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, opacity: item.done ? 0.5 : 1 }}>
          <Ionicons name={item.done ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={item.done ? '#4CAF50' : '#DDD'} />
          <Text style={[{ fontSize: 13, color: '#333', flex: 1 }, item.done && { textDecorationLine: 'line-through', color: '#AAA' }]}>{item.label}</Text>
          {!item.done && item.action && <Ionicons name="chevron-forward" size={14} color="#2196F3" />}
        </TouchableOpacity>
      ))}
    </View>
  );
}

/* ===== HELP CENTER - FAQ + guides ===== */
const FAQ_DATA = [
  { q: "Comment fonctionne l'alerte SOS ?", a: "Appuyez sur le bouton rouge SOS. Vos gardiens sont immediatement alertes. Si vous avez un abonnement Care, la teleassistance IA vous appelle pour verifier votre etat." },
  { q: "Comment ajouter un gardien ?", a: "Allez dans 'Ajouter un beneficiaire' depuis le dashboard gardien, puis scannez le QR code ou entrez le code de liaison du beneficiaire." },
  { q: "Qu'est-ce que le mode prescripteur ?", a: "Le mode prescripteur permet aux professionnels de sante de recommander Chutex a leurs patients et de gagner des commissions sur les abonnements souscrits." },
  { q: "Comment activer l'espace intervenant Care ?", a: "Allez dans l'onglet Interventions, entrez le code intervenant fourni par votre structure, puis cliquez 'Activer mon espace'. Vous recevrez les missions d'intervention." },
  { q: "Comment configurer les seuils d'alerte sante ?", a: "Depuis l'onglet Sante, cliquez sur une constante (ex: frequence cardiaque), puis 'Modifier les seuils'. Definissez les valeurs min/max qui declencheront une alerte." },
  { q: "Comment fonctionne le suivi en temps reel ?", a: "Quand un intervenant accepte une mission, vous pouvez suivre sa position sur la carte en temps reel, comme une course Uber." },
  { q: "Qui peut voir mes donnees de sante ?", a: "Seuls vos gardiens designes et les operateurs de teleassistance (si abonnement Care) ont acces a vos donnees. Vous controlez le partage dans les reglages." },
  { q: "Comment fonctionne le challenge prescripteurs ?", a: "Chaque mois, les 3 meilleurs prescripteurs recoivent une prime. Le classement est anonyme. Vos prescriptions validees du mois en cours comptent." },
];

export function HelpCenter({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);
  const filtered = search.trim() ? FAQ_DATA.filter(f => f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase())) : FAQ_DATA;
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '90%', flex: 1 }}>
          <View style={{ alignItems: 'center', paddingTop: 12 }}><View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#DDD' }} /></View>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, gap: 10 }}>
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center' }}>
              <Ionicons name="help-buoy" size={22} color="#2196F3" />
            </View>
            <Text style={{ fontSize: 20, fontWeight: '900', color: '#000', flex: 1 }}>Centre d'aide</Text>
            <TouchableOpacity onPress={onClose}><Ionicons name="close" size={24} color="#888" /></TouchableOpacity>
          </View>
          <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F5F5', borderRadius: 12, paddingHorizontal: 12, gap: 8 }}>
              <Ionicons name="search" size={18} color="#888" />
              <TextInput style={{ flex: 1, paddingVertical: 12, fontSize: 14 }} placeholder="Rechercher dans l'aide..." placeholderTextColor="#AAA" value={search} onChangeText={setSearch} />
            </View>
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#000', marginBottom: 12 }}>Questions frequentes</Text>
            {filtered.map((f, i) => (
              <TouchableOpacity key={i} onPress={() => setExpanded(expanded === i ? null : i)}
                style={{ backgroundColor: expanded === i ? '#F5F9FF' : '#FAFAFA', borderRadius: 14, padding: 14, marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Ionicons name={expanded === i ? 'chevron-down' : 'chevron-forward'} size={16} color="#2196F3" />
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#000', flex: 1 }}>{f.q}</Text>
                </View>
                {expanded === i && <Text style={{ fontSize: 13, color: '#555', lineHeight: 20, marginTop: 10, marginLeft: 26 }}>{f.a}</Text>}
              </TouchableOpacity>
            ))}
            {filtered.length === 0 && (
              <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                <Ionicons name="search-outline" size={36} color="#DDD" />
                <Text style={{ fontSize: 14, color: '#888', marginTop: 8 }}>Aucun resultat</Text>
              </View>
            )}
            <View style={{ backgroundColor: '#F5F5F5', borderRadius: 14, padding: 16, marginTop: 16, alignItems: 'center' }}>
              <Ionicons name="mail-outline" size={24} color="#2196F3" />
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#000', marginTop: 8 }}>Besoin d'aide supplementaire ?</Text>
              <Text style={{ fontSize: 12, color: '#888', marginTop: 4, textAlign: 'center' }}>Contactez notre equipe support</Text>
              <TouchableOpacity style={{ backgroundColor: '#2196F3', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10, marginTop: 12 }}>
                <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '700' }}>support@chutex.fr</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

/* ===== MINI TUTO - Step-by-step contextual guide, shown once ===== */
export function MiniTuto({ id, steps, triggerLabel }: { id: string; steps: { title: string; text: string; icon?: string }[]; triggerLabel?: string }) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);
  const [dismissed, setDismissed] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const storageKey = `tuto_done_${id}`;

  useEffect(() => {
    AsyncStorage.getItem(storageKey).then(v => { if (!v) setDismissed(false); });
  }, []);

  useEffect(() => {
    if (visible) Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  }, [visible, step]);

  const finish = () => { setVisible(false); setDismissed(true); AsyncStorage.setItem(storageKey, 'true'); };
  const next = () => { if (step < steps.length - 1) { fadeAnim.setValue(0); setStep(step + 1); } else finish(); };

  if (dismissed && !visible) return null;

  return (
    <>
      {!visible && (
        <TouchableOpacity onPress={() => { setStep(0); setVisible(true); }} data-testid={`tuto-trigger-${id}`}
          style={{ backgroundColor: '#E3F2FD', borderRadius: 14, padding: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#BBDEFB' }}>
          <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#2196F3', justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="school-outline" size={16} color="#FFF" />
          </View>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#1565C0', flex: 1 }}>{triggerLabel || 'Decouvrir comment ca marche'}</Text>
          <Ionicons name="play-circle" size={22} color="#2196F3" />
          <TouchableOpacity onPress={() => { setDismissed(true); AsyncStorage.setItem(storageKey, 'true'); }} style={{ padding: 2 }}>
            <Ionicons name="close" size={16} color="#90CAF9" />
          </TouchableOpacity>
        </TouchableOpacity>
      )}
      <Modal visible={visible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Animated.View style={{ opacity: fadeAnim, backgroundColor: '#FFF', borderRadius: 28, padding: 28, width: '100%', maxWidth: 400, ...glass }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {steps.map((_, i) => (
                  <View key={i} style={{ width: i === step ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: i === step ? '#2196F3' : i < step ? '#4CAF50' : '#E0E0E0' }} />
                ))}
              </View>
              <TouchableOpacity onPress={finish}><Ionicons name="close" size={22} color="#888" /></TouchableOpacity>
            </View>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 16 }}>
              <Ionicons name={(steps[step]?.icon || 'information-circle') as any} size={28} color="#2196F3" />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#000', textAlign: 'center', marginBottom: 8 }}>{steps[step]?.title}</Text>
            <Text style={{ fontSize: 14, color: '#555', lineHeight: 22, textAlign: 'center', marginBottom: 24 }}>{steps[step]?.text}</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {step > 0 && (
                <TouchableOpacity onPress={() => { fadeAnim.setValue(0); setStep(step - 1); }}
                  style={{ flex: 1, borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#888' }}>Retour</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={next} data-testid={`tuto-next-${id}`}
                style={{ flex: 2, backgroundColor: step === steps.length - 1 ? '#4CAF50' : '#2196F3', borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#FFF' }}>
                  {step === steps.length - 1 ? 'Compris !' : `Suivant (${step + 1}/${steps.length})`}
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

/* ===== PAGE EXPLAINER - "Comprendre cette page" bottom sheet ===== */
export function PageExplainer({ pageId, title, sections }: { pageId: string; title: string; sections: { icon: string; heading: string; text: string }[] }) {
  const [visible, setVisible] = useState(false);
  return (
    <View>
      <TouchableOpacity onPress={() => setVisible(true)} testID={`explainer-${pageId}`}
        style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 12, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, backgroundColor: 'rgba(33,150,243,0.06)', borderWidth: 1, borderColor: 'rgba(33,150,243,0.12)' }}>
        <Ionicons name="book-outline" size={14} color="#2196F3" />
        <Text style={{ fontSize: 12, fontWeight: '600', color: '#2196F3' }}>Comprendre cette page</Text>
      </TouchableOpacity>
      <Modal visible={visible} transparent animationType="slide">
        <TouchableOpacity activeOpacity={1} onPress={() => setVisible(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}} style={{ backgroundColor: '#FFF', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '80%' }}>
            <View style={{ alignItems: 'center', paddingTop: 12 }}><View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#DDD' }} /></View>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, gap: 10 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center' }}>
                <Ionicons name="book" size={20} color="#2196F3" />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#000', flex: 1 }}>{title}</Text>
              <TouchableOpacity onPress={() => setVisible(false)}><Ionicons name="close" size={22} color="#888" /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 16 }}>
              {sections.map((s, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginTop: 2 }}>
                    <Ionicons name={s.icon as any} size={18} color="#2196F3" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#000', marginBottom: 4 }}>{s.heading}</Text>
                    <Text style={{ fontSize: 13, color: '#555', lineHeight: 20 }}>{s.text}</Text>
                  </View>
                </View>
              ))}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

/* ===== EMPTY STATE - Pedagogical empty state with action ===== */
export function EmptyState({ icon, title, subtitle, actionLabel, onAction, testId }: { icon: string; title: string; subtitle: string; actionLabel?: string; onAction?: () => void; testId?: string }) {
  return (
    <View style={{ backgroundColor: 'rgba(255,255,255,0.45)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.7)', padding: 32, alignItems: 'center', ...glass }} data-testid={testId}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(33,150,243,0.06)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
        <Ionicons name={icon as any} size={30} color="#90CAF9" />
      </View>
      <Text style={{ fontSize: 16, fontWeight: '800', color: '#000', textAlign: 'center', marginBottom: 6 }}>{title}</Text>
      <Text style={{ fontSize: 13, color: '#888', textAlign: 'center', lineHeight: 20, paddingHorizontal: 10 }}>{subtitle}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity onPress={onAction} style={{ backgroundColor: '#000', borderRadius: 9999, paddingVertical: 12, paddingHorizontal: 24, marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '700' }}>{actionLabel}</Text>
          <Ionicons name="arrow-forward" size={14} color="#FFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}

