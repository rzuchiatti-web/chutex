import { useI18n } from '../context/I18nContext';
import { Icon } from './WebIcon';
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView, Platform, TextInput, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const glass = Platform.OS === 'web' ? { backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' } : {};
const { width: SCREEN_W } = Dimensions.get('window');

/* ===== HELP BUBBLE - "?" button that shows contextual help ===== */
export function HelpBubble({ id, title, description, steps }: { id: string; title: string; description: string; steps?: string[] }) {
  const { t } = useI18n();
  const [show, setShow] = useState(false);
  return (
    <>
      <TouchableOpacity onPress={() => setShow(true)} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(33,150,243,0.1)', justifyContent: 'center', alignItems: 'center' }} data-testid={`help-${id}`}>
        <Icon name="help-circle" size={18} color="#2196F3" />
      </TouchableOpacity>
      <Modal visible={show} transparent animationType="fade">
        <TouchableOpacity activeOpacity={1} onPress={() => setShow(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}} style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, maxHeight: '70%' }}>
            <View style={{ alignItems: 'center', paddingBottom: 8 }}><View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#DDD' }} /></View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center' }}>
                <Icon name="information-circle" size={22} color="#2196F3" />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '900', color: 'rgba(255,255,255,0.92)', flex: 1 }}>{title}</Text>
              <TouchableOpacity onPress={() => setShow(false)}><Icon name="close" size={22} color="#888" /></TouchableOpacity>
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
      <Icon name={(icon || 'bulb-outline') as any} size={18} color={c} style={{ marginTop: 1 }} />
      <Text style={{ fontSize: 13, color: '#333', lineHeight: 19, flex: 1 }}>{text}</Text>
      <TouchableOpacity onPress={dismiss} style={{ padding: 2 }}><Icon name="close" size={16} color="#AAA" /></TouchableOpacity>
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
      <Icon name={cfg.icon as any} size={20} color="#FFF" />
      <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFF', flex: 1 }}>{message}</Text>
      <TouchableOpacity onPress={onDismiss}><Icon name="close" size={18} color="rgba(255,255,255,0.10)" /></TouchableOpacity>
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
    <View style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', padding: 18, marginBottom: 12, ...glass }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center' }}>
          <Icon name="rocket-outline" size={18} color="#2196F3" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.92)' }}>{title}</Text>
          <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.50)' }}>{completed}/{total} etapes completees</Text>
        </View>
      </View>
      <View style={{ height: 6, backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 3, marginBottom: 12, overflow: 'hidden' }}>
        <View style={{ height: 6, backgroundColor: '#2196F3', borderRadius: 3, width: `${pct}%` }} />
      </View>
      {items.map((item, i) => (
        <TouchableOpacity key={i} disabled={item.done || !item.action} onPress={item.action}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, opacity: item.done ? 0.5 : 1 }}>
          <Icon name={item.done ? 'checkmark-circle' : 'ellipse-outline'} size={20} color={item.done ? '#4CAF50' : '#DDD'} />
          <Text style={[{ fontSize: 13, color: '#333', flex: 1 }, item.done && { textDecorationLine: 'line-through', color: '#AAA' }]}>{item.label}</Text>
          {!item.done && item.action && <Icon name="chevron-forward" size={14} color="#2196F3" />}
        </TouchableOpacity>
      ))}
    </View>
  );
}

/* ===== HELP CENTER - FAQ + guides ===== */
const FAQ_GENERAL = [
  { q: "Comment fonctionne l'alerte SOS ?", a: "Appuyez sur le bouton rouge SOS. Vos gardiens sont immédiatement alertes par notification, SMS et email. Si vous avez un abonnement Care, la téléassistance vous appelle pour vérifier votre etat et coordonner les secours si necessaire." },
  { q: "Comment changer de langue ?", a: "Cliquez sur le drapeau dans le header de votre dashboard ou allez dans Profil > Langue. 7 langues sont disponibles : francais, anglais, allemand, espagnol, italien, portugais et neerlandais." },
  { q: "Qui peut voir mes données de santé ?", a: "Seuls vos gardiens designes et les operateurs de téléassistance (si abonnement Care) ont acces a vos donnees. Vous contrôlez le partage dans les réglages de confidentialite." },
  { q: "Comment modifier mon profil ?", a: "Allez dans l'onglet Profil, puis cliquez sur 'Modifier le profil'. Vous pouvez mettre a jour vos informations personnelles, votre photo et votre dossier medical." },
  { q: "Comment contacter le support ?", a: "Depuis le Profil, cliquez sur 'Support' pour envoyer un email a support@chutex.fr. Vous pouvez aussi demander a Nora qui repondra a vos questions sur l'application." },
  { q: "Qui est Nora ?", a: "Nora est votre assistante medicale IA personnelle. Elle connait vos données de santé en temps reel et peut repondre a vos questions, analyser vos constantes et vous donner des recommandations personnalisées." },
];

const FAQ_BENEFICIARY = [
  { q: "Comment connecter mon bracelet ?", a: "Allez dans l'onglet Appareils, activez le Bluetooth, puis cliquez 'Rechercher et associer'. Suivez les instructions a l'ecran pour connecter votre bracelet Elio." },
  { q: "Comment faire une pesee ?", a: "Depuis la page Sante, cliquez sur t('new_weighing_action'). Suivez le parcours guide : placez la balance sur un sol dur, montez pieds nus et tenez le manche. La mesure dure 15 secondes." },
  { q: "Comment realiser un ECG ?", a: "Depuis la page Sante, cliquez sur 'Realiser un ECG'. L'app vous guide : asseyez-vous, respirez calmement pendant 15s, placez votre doigt sur le capteur du bracelet et attendez 30 secondes." },
  { q: "Que signifient les zones de couleur sur mes donnees ?", a: "Vert = zone normale, Bleu = en dessous de la normale, Rouge = au dessus de la normale. Le marqueur rond indique votre valeur actuelle sur la barre." },
  { q: "Comment ajouter un gardien ?", a: "Sur votre dashboard, faites defiler jusqu'a la section 'Mes gardiens', puis cliquez le bouton '+'. Entrez le numéro de telephone de votre proche et choisissez le type de lien (famille ou professionnel)." },
  { q: "Comment fonctionnent les rappels ?", a: "Cliquez sur une catégorie de rappel (hydratation, traitement, alarme) sur le dashboard. Vous pouvez ajouter, modifier l'heure et les jours, activer/désactivér chaque rappel." },
  { q: "Qu'est-ce que le morning briefing ?", a: "A chaque connexion, Nora vous accueille avec un resume personnalisé de votre etat de sante, vos objectifs du jour et des recommandations basees sur vos donnees recentes." },
  { q: "Comment comprendre mon age biologique ?", a: "L'age biologique est calcule a partir de votre composition corporelle, vos constantes et votre activité. Un age bio inférieur a votre age reel signifie que votre corps est en meilleure sante que la moyenne." },
  { q: "Comment activer l'espace gardien ?", a: "Sur le dashboard bénéficiaire, cliquez sur 'Devenir aidant'. Suivez les etapes pour configurer vos alertes SMS et email, puis activez votre espace gardien." },
];

const FAQ_GUARDIAN = [
  { q: "Comment ajouter un bénéficiaire ?", a: "Sur votre dashboard gardien, cliquez 'Ajouter un bénéficiaire'. Entrez le numéro de telephone de votre proche. S'il a déjà un compte, il recevra une invitation. Sinon, un SMS lui sera envoye." },
  { q: "Comment suivre la sante de mes proches ?", a: "Cliquez sur la fiche d'un bénéficiaire pour voir ses constantes en temps reel (FC, SpO2, tension, temperature), ses alertes et son historique de sante." },
  { q: "Comment recevoir les alertes ?", a: "Les alertes sont envoyees automatiquement par notification push, SMS et email selon vos préférences. Configurez-les dans votre espace gardien lors de l'activation." },
  { q: "Qu'est-ce qu'une intervention ?", a: "Quand une alerte se declenche, le système peut vous demander d'intervenir si vous etes le gardien le plus proche. Vous pouvez accepter la mission et vous rendre sur place." },
  { q: "Comment fonctionne le suivi en temps reel ?", a: "Quand un intervenant accepte une mission, vous pouvez suivre sa position sur la carte en temps reel, comme une course de VTC. Vous voyez sa progression vers le bénéficiaire." },
  { q: "Comment discuter avec Nora en tant que gardien ?", a: "Cliquez sur la carte Nora IA. En espace gardien, Nora connait les donnees de tous vos bénéficiaires et peut vous aider sur les alertes, interventions et le fonctionnement de l'espace." },
  { q: "Comment me rattacher a une structure SAAD ?", a: "Votre structure SAAD vous enverra une invitation. Vous la verrez sur votre dashboard gardien. Acceptez-la pour etre rattache et recevoir les missions d'intervention." },
  { q: "Comment basculer entre bénéficiaire et gardien ?", a: "Cliquez sur votre avatar en haut du dashboard. Le menu vous permet de switcher entre vos espaces bénéficiaire et gardien." },
];

const FAQ_SAAD = [
  { q: "Comment gerer mes intervenants ?", a: "Depuis votre dashboard SAAD, cliquez sur 'Intervention Care'. Vous verrez la liste de vos intervenants, leur disponibilité et leurs missions en cours." },
  { q: "Comment fonctionne le système de prescriptions ?", a: "Les prescripteurs rattaches a votre structure prescrivent Care Watch a leurs patients. Chaque souscription validee genere une commission. Suivez les stats dans la section Prescriptions." },
  { q: "Comment voir le classement des prescripteurs ?", a: "Le classement mensuel est affiche sur votre dashboard dans la section 'Challenge prescripteurs'. Les 3 premiers recoivent les primes configurees." },
  { q: "Comment configurer les recompenses ?", a: "En tant qu'admin, allez dans le Back-Office > Recompenses. Definissez les montants pour le 1er, 2e et 3e prescripteur du mois." },
  { q: "Comment rattacher un gardien a ma structure ?", a: "Depuis le Back-Office, allez dans Intervenants > Inviter. Entrez l'email ou le telephone du professionnel. Il recevra une invitation pour se rattacher a votre SAAD." },
  { q: "Comment suivre les alertes de mes bénéficiaires ?", a: "Toutes les alertes remontent sur votre dashboard avec le taux de resolution. Cliquez sur une alerte pour voir les details, l'historique des interventions et le statut." },
  { q: "Comment gerer mes agences ?", a: "Depuis le dashboard SAAD, vous voyez le nombre d'agences. Cliquez sur la section Structure pour gerer vos agences, ajouter des intervenants par agence et suivre l'activité." },
  { q: "Comment voir les rapports de sante ?", a: "Pour chaque bénéficiaire rattache, vous pouvez consulter un rapport de sante complet avec l'analyse IA de Nora, les constantes et les recommandations." },
];

export function HelpCenter({ visible, onClose, role }: { visible: boolean; onClose: () => void; role?: string }) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', label: 'General', data: FAQ_GENERAL },
    ...(role === 'guardian' ? [{ id: 'guardian', label: t('guardian'), data: FAQ_GUARDIAN }] : []),
    ...(role === 'beneficiary' || !role ? [{ id: 'beneficiary', label: 'Bénéficiaire', data: FAQ_BENEFICIARY }] : []),
    ...(role === 'prescriber_company' || role === 'admin' ? [{ id: 'saad', label: 'SAAD', data: FAQ_SAAD }] : []),
  ];

  const currentData = tabs.find(t => t.id === activeTab)?.data || FAQ_GENERAL;
  const filtered = search.trim() ? currentData.filter(f => f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase())) : currentData;

  if (!visible) return null;

  if (Platform.OS === 'web') {
    return (
      <div onClick={onClose} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', background: 'rgba(0,0,0,0.2)', overflowY: 'scroll', WebkitOverflowScrolling: 'touch' } as any}>
        <div onClick={(e: any) => e.stopPropagation()} className="anim-up" style={{ width: '100%', maxWidth: 440, margin: '0 auto', padding: '70px 28px 120px', boxSizing: 'border-box' } as any}>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 } as any}>
            <div onClick={onClose} style={{ width: 38, height: 38, borderRadius: 999, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' } as any}><i className="ri-close-line" style={{ fontSize: 18, color: 'rgba(255,255,255,0.8)' }} /></div>
          </div>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>Assistance</div>
          <div style={{ fontSize: 24, fontWeight: 800, color: '#FFF', marginBottom: 20 }}>Centre d'aide</div>
          {/* Search */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 14 } as any}>
            <i className="ri-search-line" style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)' }} />
            <input value={search} onChange={(e: any) => setSearch(e.target.value)} placeholder="Rechercher..." style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: '#FFF', fontSize: 14, fontFamily: 'inherit' } as any} />
          </div>
          {/* Role tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 16, overflowX: 'auto' } as any}>
            {tabs.map(tab => (
              <div key={tab.id} onClick={() => { setActiveTab(tab.id); setExpanded(null); }} style={{ padding: '8px 14px', borderRadius: 10, background: activeTab === tab.id ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.04)', border: `1px solid ${activeTab === tab.id ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)'}`, cursor: 'pointer', fontSize: 12, fontWeight: activeTab === tab.id ? 800 : 500, color: activeTab === tab.id ? '#FFF' : 'rgba(255,255,255,0.35)', whiteSpace: 'nowrap', flexShrink: 0 } as any}>{tab.label}</div>
            ))}
          </div>
          {/* FAQ */}
          {filtered.map((f, i) => (
            <div key={i} onClick={() => setExpanded(expanded === i ? null : i)} style={{ padding: '14px 0', borderBottom: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' } as any}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 } as any}>
                <i className={expanded === i ? 'ri-arrow-down-s-line' : 'ri-arrow-right-s-line'} style={{ fontSize: 16, color: 'rgba(255,255,255,0.4)', flexShrink: 0 }} />
                <span style={{ fontSize: 14, fontWeight: 700, color: '#FFF', flex: 1 }}>{f.q}</span>
              </div>
              {expanded === i && <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.6, marginTop: 10, marginLeft: 26 }}>{f.a}</div>}
            </div>
          ))}
          {filtered.length === 0 && <div style={{ textAlign: 'center', padding: '30px 0', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>Aucun résultat</div>}
          {/* Contact */}
          <div style={{ marginTop: 24, padding: '18px', borderRadius: 18, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' } as any}>
            <i className="ri-mail-line" style={{ fontSize: 22, color: 'rgba(255,255,255,0.4)' }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: '#FFF', marginTop: 8 }}>Besoin d'aide ?</div>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>support@chutex.fr</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
        <View style={{ backgroundColor: '#111', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '90%', flex: 1 }}>
          <View style={{ alignItems: 'center', paddingTop: 12 }}><View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.2)' }} /></View>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, gap: 10 }}>
            <Text style={{ fontSize: 20, fontWeight: '900', color: '#FFF', flex: 1 }}>Centre d'aide</Text>
            <TouchableOpacity onPress={onClose}><Icon name="close" size={24} color="#888" /></TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
            {filtered.map((f, i) => (
              <TouchableOpacity key={i} onPress={() => setExpanded(expanded === i ? null : i)}
                style={{ backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 14, padding: 14, marginBottom: 8 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <Icon name={expanded === i ? 'chevron-down' : 'chevron-forward'} size={16} color="#A78BFA" />
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFF', flex: 1 }}>{f.q}</Text>
                </View>
                {expanded === i && <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 20, marginTop: 10, marginLeft: 26 }}>{f.a}</Text>}
              </TouchableOpacity>
            ))}
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
            <Icon name="school-outline" size={16} color="#FFF" />
          </View>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#1565C0', flex: 1 }}>{triggerLabel || 'Decouvrir comment ca marche'}</Text>
          <Icon name="play-circle" size={22} color="#2196F3" />
          <TouchableOpacity onPress={() => { setDismissed(true); AsyncStorage.setItem(storageKey, 'true'); }} style={{ padding: 2 }}>
            <Icon name="close" size={16} color="#90CAF9" />
          </TouchableOpacity>
        </TouchableOpacity>
      )}
      <Modal visible={visible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Animated.View style={{ opacity: fadeAnim, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 28, padding: 28, width: '100%', maxWidth: 400, ...glass }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {steps.map((_, i) => (
                  <View key={i} style={{ width: i === step ? 24 : 8, height: 8, borderRadius: 4, backgroundColor: i === step ? '#2196F3' : i < step ? '#4CAF50' : '#E0E0E0' }} />
                ))}
              </View>
              <TouchableOpacity onPress={finish}><Icon name="close" size={22} color="#888" /></TouchableOpacity>
            </View>
            <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 16 }}>
              <Icon name={(steps[step]?.icon || 'information-circle') as any} size={28} color="#2196F3" />
            </View>
            <Text style={{ fontSize: 18, fontWeight: '900', color: 'rgba(255,255,255,0.92)', textAlign: 'center', marginBottom: 8 }}>{steps[step]?.title}</Text>
            <Text style={{ fontSize: 14, color: '#555', lineHeight: 22, textAlign: 'center', marginBottom: 24 }}>{steps[step]?.text}</Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {step > 0 && (
                <TouchableOpacity onPress={() => { fadeAnim.setValue(0); setStep(step - 1); }}
                  style={{ flex: 1, borderWidth: 1.5, borderColor: '#E0E0E0', borderRadius: 14, paddingVertical: 14, alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: 'rgba(255,255,255,0.50)' }}>Retour</Text>
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
        <Icon name="book-outline" size={14} color="#2196F3" />
        <Text style={{ fontSize: 12, fontWeight: '600', color: '#2196F3' }}>Comprendre cette page</Text>
      </TouchableOpacity>
      <Modal visible={visible} transparent animationType="slide">
        <TouchableOpacity activeOpacity={1} onPress={() => setVisible(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}} style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '80%' }}>
            <View style={{ alignItems: 'center', paddingTop: 12 }}><View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: '#DDD' }} /></View>
            <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, gap: 10 }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#E3F2FD', justifyContent: 'center', alignItems: 'center' }}>
                <Icon name="book" size={20} color="#2196F3" />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '900', color: 'rgba(255,255,255,0.92)', flex: 1 }}>{title}</Text>
              <TouchableOpacity onPress={() => setVisible(false)}><Icon name="close" size={22} color="#888" /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40, gap: 16 }}>
              {sections.map((s, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                  <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F5F5', justifyContent: 'center', alignItems: 'center', marginTop: 2 }}>
                    <Icon name={s.icon as any} size={18} color="#2196F3" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '800', color: 'rgba(255,255,255,0.92)', marginBottom: 4 }}>{s.heading}</Text>
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
    <View style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)', padding: 32, alignItems: 'center', ...glass }} data-testid={testId}>
      <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(33,150,243,0.06)', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
        <Icon name={icon as any} size={30} color="#90CAF9" />
      </View>
      <Text style={{ fontSize: 16, fontWeight: '800', color: 'rgba(255,255,255,0.92)', textAlign: 'center', marginBottom: 6 }}>{title}</Text>
      <Text style={{ fontSize: 13, color: 'rgba(255,255,255,0.50)', textAlign: 'center', lineHeight: 20, paddingHorizontal: 10 }}>{subtitle}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity onPress={onAction} style={{ backgroundColor: '#000', borderRadius: 9999, paddingVertical: 12, paddingHorizontal: 24, marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '700' }}>{actionLabel}</Text>
          <Icon name="arrow-forward" size={14} color="#FFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}

