import { Platform, Alert } from 'react-native';

export const confirmAction = (title: string, message: string, onConfirm: () => void) => {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
  } else {
    Alert.alert(title, message, [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Confirmer', style: 'destructive', onPress: onConfirm },
    ]);
  }
};

export const BRACELET_STEPS = [
  { icon: 'ri-link-unlink', title: 'Dissociez l\'app fabricant', desc: 'Si le bracelet est connecte a l\'app du fabricant (ex: WearFit Pro), dissociez-le d\'abord via "Unpair Device" dans l\'app fabricant.', tip: 'Un bracelet BLE ne peut etre connecte qu\'a une seule application a la fois.' },
  { icon: 'ri-battery-charge-line', title: 'Verifiez la charge', desc: 'Assurez-vous que le bracelet est charge (au moins 20%). L\'ecran du bracelet doit etre allume.', tip: 'Maintenez le bouton lateral 3s si l\'ecran est eteint.' },
  { icon: 'ri-bluetooth-connect-line', title: 'Lancer l\'appairage', desc: 'Rapprochez le bracelet de votre telephone (moins d\'1 metre). L\'app va scanner et detecter votre bracelet automatiquement.', tip: 'Assurez-vous que le Bluetooth est active dans les parametres de votre telephone.' },
];

export const VEST_STEPS = [
  { icon: 'ri-shirt-line', title: 'Enfilez le gilet', desc: 'Enfilez le gilet Elder par-dessus vos vetements. Assurez-vous que la fermeture eclair est bien en face avant.', tip: 'Le gilet doit etre porte pres du corps pour une detection optimale des chutes.' },
  { icon: 'ri-ruler-line', title: 'Ajustez les sangles', desc: 'Serrez les sangles laterales pour que le gilet soit bien ajuste a votre taille. Il ne doit pas etre trop lache.', tip: 'Un ajustement correct est essentiel pour le bon fonctionnement des airbags.' },
  { icon: 'ri-power-line', title: 'Activez le gilet', desc: 'Appuyez sur le bouton d\'alimentation situe a l\'avant, en bas du gilet. Un bip sonore confirme l\'activation.', tip: 'Le voyant vert fixe signifie que le gilet est pret. Un voyant rouge signifie que la batterie est faible.' },
  { icon: 'ri-bluetooth-connect-line', title: 'Recherche en cours...', desc: 'Rapprochez votre telephone du gilet. L\'appairage Bluetooth va demarrer automatiquement.', tip: 'Le gilet est detecte sous le nom "Elder-XXXX" dans la liste Bluetooth.' },
];

export const SCALE_STEPS = [
  { icon: 'ri-scales-3-line', title: 'Placez la balance', desc: 'Posez la balance sur une surface plane et dure. Evitez les tapis et moquettes.', tip: 'Une surface stable est necessaire pour des mesures precises.' },
  { icon: 'ri-bluetooth-connect-line', title: 'Montez sur la balance', desc: 'Montez pieds nus sur la balance. Elle s\'allume automatiquement et lance la recherche Bluetooth.', tip: 'Restez immobile pendant la mesure pour un resultat optimal.' },
];

export const DORSI_STEPS = [
  { icon: 'ri-armchair-line', title: 'Placez le coussin', desc: 'Posez le coussin Dorsi sur une chaise a dossier droit. La face avec le logo doit etre vers le haut.', tip: 'Le coussin fonctionne mieux sur une surface plane et stable.' },
  { icon: 'ri-user-line', title: 'Asseyez-vous', desc: 'Asseyez-vous au centre du coussin, le dos bien droit contre le dossier. Les pieds doivent etre a plat au sol.', tip: 'Une bonne position de depart est essentielle pour des mesures precises.' },
  { icon: 'ri-bluetooth-connect-line', title: 'Connexion en cours...', desc: 'Le coussin Dorsi se connecte automatiquement via Bluetooth. Attendez la confirmation.', tip: 'Le coussin est detecte sous le nom "Dorsi-XXXX" dans la liste Bluetooth.' },
];

export const DEVICE_META: Record<string, { name: string; desc: string; img: string; link: string; color: string; steps: any[] }> = {
  bracelet: { name: 'Bracelet Elio', desc: 'Suivi cardiaque, SpO2, temperature et detection de chute en continu.', img: 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/2fto1qw7_bracelet_sante_connecte_elio_chutex_care_teleassistance_telealarme%281%29.svg', link: 'https://chutex-innovation.com/bracelet-elio', color: '#22D3EE', steps: BRACELET_STEPS },
  scale: { name: 'Balance Vita', desc: 'Poids et composition corporelle avec plus de 30 metriques de sante.', img: 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/dwmw2i8r_Balance_connecte_Vita_chutex.svg', link: 'https://chutex-innovation.com/balance-vita', color: '#A78BFA', steps: SCALE_STEPS },
  vest: { name: 'Gilet Elder', desc: 'Protection anti-chute par airbag. Se gonfle automatiquement en cas de chute.', img: 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/ljh1zzu3_Gilet_Elder_airbag_Chutex.svg', link: 'https://chutex-innovation.com/gilet-elder', color: '#10B981', steps: VEST_STEPS },
  dorsi: { name: 'Coussin Dorsi', desc: 'Coussin intelligent de reeducation lombaire avec capteur gyroscopique integre.', img: 'https://customer-assets.emergentagent.com/job_e5e873d0-c3a6-4073-8807-5b369c712c84/artifacts/9s6gmyyj_img4_gardien%282%29.png', link: 'https://chutex-innovation.com/coussin-dorsi', color: '#F97316', steps: DORSI_STEPS },
};

export const BG_BLACK = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/j2b92wwx_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2015_59_23.png';

export const ALL_DEVICE_TYPES = ['bracelet', 'scale', 'vest', 'dorsi'] as const;
