import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TRANSLATIONS: Record<string, Record<string, string>> = {
  FR: {
    home: 'Accueil', health: 'Sante', alerts: 'Alertes', devices: 'Appareils', profile: 'Profil',
    hello: 'Bonjour', online: 'En ligne', sos: 'SOS', sos_sub: "Appuyez en cas d'urgence",
    heart_health: 'Sante cardiaque', blood_health: 'Sante du sang', sleep_health: 'Sante du sommeil', physical_health: 'Sante physique',
    guardians: 'GARDIENS', connected: 'CONNECTE', disconnected: 'Deconnecte',
    good_health: 'BONNE SANTE', attention: 'ATTENTION',
    reminders: 'Mes rappels', hydration: 'Hydratation', treatments: 'Traitements', alarms: 'Alarmes quotidiennes',
    time_remaining: 'Prochain dans', add_reminder: 'AJOUTER UN RAPPEL', delete: 'Supprimer', cancel: 'Annuler', confirm: 'Confirmer',
    manage_reminders: 'GERER MES RAPPELS', physical_activity: 'Activite physique', daily_goal: 'OBJECTIF JOURNALIER',
    modify_profile: 'Modifier mon profil', security: 'Securite (mot de passe)', language: 'Langue',
    notifications: 'Notifications', terms: "Conditions generales d'utilisation", support: 'Assistance', about: 'A propos',
    logout: 'SE DECONNECTER', beneficiary: 'Beneficiaire', guardian: 'Gardien',
    my_guardian_space: 'Mon espace gardien', my_beneficiary_space: 'Mon espace beneficiaire',
    active_alerts: 'Actives', resolved_alerts: 'Resolues', no_active_alert: 'Aucune alerte active', all_good: 'Tout va bien !',
    thresholds: "Seuils d'alertes", low_threshold: 'Seuil bas', high_threshold: 'Seuil haut', modify_thresholds: 'MODIFIER LES SEUILS',
    confirm_thresholds: 'CONFIRMER LES NOUVEAUX SEUILS', ai_analysis: 'Analyse IA',
    login: 'Connexion', register: 'Inscription', connect: 'Se connecter', email_or_phone: 'Email ou telephone', password: 'Mot de passe',
    steps: 'Pas', kcal: 'kcal', km: 'km', bpm: 'bpm',
    pulse: 'Pouls', spo2: 'SpO2 du sang', temperature: 'Temperature', sleep: 'Sommeil',
    add_beneficiary: 'AJOUTER UN BENEFICIAIRE', information: 'INFORMATION',
    intervention_required: 'INTERVENTION REQUISE', i_intervene: "J'INTERVIENS",
    accept: 'ACCEPTER', reject: 'REFUSER', guardian_request: 'DEMANDE DE GARDIEN',
  },
  EN: {
    home: 'Home', health: 'Health', alerts: 'Alerts', devices: 'Devices', profile: 'Profile',
    hello: 'Hello', online: 'Online', sos: 'SOS', sos_sub: 'Press in case of emergency',
    heart_health: 'Heart health', blood_health: 'Blood health', sleep_health: 'Sleep health', physical_health: 'Physical health',
    guardians: 'GUARDIANS', connected: 'CONNECTED', disconnected: 'Disconnected',
    good_health: 'GOOD HEALTH', attention: 'WARNING',
    reminders: 'My reminders', hydration: 'Hydration', treatments: 'Treatments', alarms: 'Daily alarms',
    time_remaining: 'Next in', add_reminder: 'ADD REMINDER', delete: 'Delete', cancel: 'Cancel', confirm: 'Confirm',
    manage_reminders: 'MANAGE REMINDERS', physical_activity: 'Physical activity', daily_goal: 'DAILY GOAL',
    modify_profile: 'Edit my profile', security: 'Security (password)', language: 'Language',
    notifications: 'Notifications', terms: 'Terms of use', support: 'Support', about: 'About',
    logout: 'SIGN OUT', beneficiary: 'Beneficiary', guardian: 'Guardian',
    my_guardian_space: 'My guardian space', my_beneficiary_space: 'My beneficiary space',
    active_alerts: 'Active', resolved_alerts: 'Resolved', no_active_alert: 'No active alert', all_good: 'All good!',
    thresholds: 'Alert thresholds', low_threshold: 'Low', high_threshold: 'High', modify_thresholds: 'MODIFY THRESHOLDS',
    confirm_thresholds: 'CONFIRM NEW THRESHOLDS', ai_analysis: 'AI Analysis',
    login: 'Login', register: 'Register', connect: 'Sign in', email_or_phone: 'Email or phone', password: 'Password',
    steps: 'Steps', kcal: 'kcal', km: 'km', bpm: 'bpm',
    pulse: 'Heart rate', spo2: 'Blood SpO2', temperature: 'Temperature', sleep: 'Sleep',
    add_beneficiary: 'ADD BENEFICIARY', information: 'INFORMATION',
    intervention_required: 'INTERVENTION REQUIRED', i_intervene: 'I INTERVENE',
    accept: 'ACCEPT', reject: 'REJECT', guardian_request: 'GUARDIAN REQUEST',
  },
  DE: {
    home: 'Startseite', health: 'Gesundheit', alerts: 'Alarme', devices: 'Gerate', profile: 'Profil',
    hello: 'Hallo', online: 'Online', sos: 'SOS', sos_sub: 'Bei Notfall drucken',
    heart_health: 'Herzgesundheit', blood_health: 'Blutgesundheit', sleep_health: 'Schlafgesundheit', physical_health: 'Korperliche Gesundheit',
    guardians: 'BETREUER', good_health: 'GUTE GESUNDHEIT', attention: 'ACHTUNG',
    reminders: 'Erinnerungen', hydration: 'Hydratation', treatments: 'Behandlungen', alarms: 'Tagliche Alarme',
    manage_reminders: 'ERINNERUNGEN VERWALTEN', physical_activity: 'Korperliche Aktivitat',
    logout: 'ABMELDEN', beneficiary: 'Begunstiger', guardian: 'Betreuer',
    login: 'Anmelden', register: 'Registrieren', connect: 'Einloggen',
    pulse: 'Puls', temperature: 'Temperatur', sleep: 'Schlaf',
  },
  ES: {
    home: 'Inicio', health: 'Salud', alerts: 'Alertas', devices: 'Dispositivos', profile: 'Perfil',
    hello: 'Hola', online: 'En linea', sos: 'SOS', sos_sub: 'Pulse en caso de emergencia',
    heart_health: 'Salud cardiaca', blood_health: 'Salud sanguinea', sleep_health: 'Salud del sueno', physical_health: 'Salud fisica',
    guardians: 'GUARDIANES', good_health: 'BUENA SALUD', attention: 'ATENCION',
    reminders: 'Recordatorios', hydration: 'Hidratacion', treatments: 'Tratamientos', alarms: 'Alarmas diarias',
    manage_reminders: 'GESTIONAR RECORDATORIOS', physical_activity: 'Actividad fisica',
    logout: 'CERRAR SESION', beneficiary: 'Beneficiario', guardian: 'Guardian',
    login: 'Iniciar sesion', register: 'Registro', connect: 'Conectar',
    pulse: 'Pulso', temperature: 'Temperatura', sleep: 'Sueno',
  },
  IT: {
    home: 'Home', health: 'Salute', alerts: 'Avvisi', devices: 'Dispositivi', profile: 'Profilo',
    hello: 'Ciao', online: 'Online', sos: 'SOS', sos_sub: "Premere in caso d'emergenza",
    heart_health: 'Salute cardiaca', blood_health: 'Salute del sangue', sleep_health: 'Salute del sonno', physical_health: 'Salute fisica',
    guardians: 'TUTORI', good_health: 'BUONA SALUTE', attention: 'ATTENZIONE',
    reminders: 'Promemoria', hydration: 'Idratazione', treatments: 'Trattamenti', alarms: 'Allarmi giornalieri',
    manage_reminders: 'GESTISCI PROMEMORIA', physical_activity: 'Attivita fisica',
    logout: 'DISCONNETTI', beneficiary: 'Beneficiario', guardian: 'Tutore',
    login: 'Accesso', register: 'Registrazione', connect: 'Accedi',
    pulse: 'Polso', temperature: 'Temperatura', sleep: 'Sonno',
  },
};

interface I18nContextType {
  lang: string;
  setLang: (l: string) => void;
  t: (key: string) => string;
  flags: { code: string; color: string }[];
}

const I18nContext = createContext<I18nContextType>({
  lang: 'FR', setLang: () => {}, t: (k) => k,
  flags: [],
});

export const useI18n = () => useContext(I18nContext);

const FLAGS = [
  { code: 'FR', color: '#002395' },
  { code: 'EN', color: '#C8102E' },
  { code: 'DE', color: '#000000' },
  { code: 'ES', color: '#AA151B' },
  { code: 'IT', color: '#009246' },
];

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState('FR');

  useEffect(() => {
    AsyncStorage.getItem('chutex_lang').then(l => { if (l && TRANSLATIONS[l]) setLangState(l); }).catch(() => {});
  }, []);

  const setLang = (l: string) => {
    setLangState(l);
    AsyncStorage.setItem('chutex_lang', l).catch(() => {});
  };

  const t = (key: string) => TRANSLATIONS[lang]?.[key] || TRANSLATIONS['FR']?.[key] || key;

  const value = useMemo(() => ({ lang, setLang, t, flags: FLAGS }), [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};
