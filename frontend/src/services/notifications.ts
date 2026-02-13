// Web Push Notification Service for CHUTEX
import { Platform } from 'react-native';

let permissionGranted = false;

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS !== 'web') return false;
  try {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') { permissionGranted = true; return true; }
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    permissionGranted = result === 'granted';
    return permissionGranted;
  } catch { return false; }
}

export function sendLocalNotification(title: string, body: string, icon?: string) {
  if (Platform.OS !== 'web') return;
  try {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    new Notification(title, {
      body,
      icon: icon || '/favicon.ico',
      badge: '/favicon.ico',
      tag: `chutex-${Date.now()}`,
      requireInteraction: false,
    });
  } catch (e) {
    console.log('Notification error:', e);
  }
}

// Check reminders and send notifications
export function startReminderChecker(reminders: any[]) {
  if (Platform.OS !== 'web') return () => {};

  const checkInterval = setInterval(() => {
    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const dayMap: Record<number, string> = { 0: 'dim', 1: 'lun', 2: 'mar', 3: 'mer', 4: 'jeu', 5: 'ven', 6: 'sam' };
    const today = dayMap[now.getDay()];

    for (const r of reminders) {
      if (!r.active) continue;
      if (r.time === currentTime && (r.days?.includes(today) || r.days?.length === 0)) {
        const typeLabels: Record<string, string> = {
          hydration: 'Hydratation',
          medication: 'Traitement',
          alarm: 'Rappel',
        };
        sendLocalNotification(
          `${typeLabels[r.reminder_type] || 'Rappel'} - CHUTEX`,
          r.title + (r.dosage ? ` (${r.dosage})` : ''),
        );
      }
    }
  }, 60000); // Check every minute

  return () => clearInterval(checkInterval);
}

// Send alert notification
export function notifyAlert(alertType: string, message: string) {
  const titles: Record<string, string> = {
    sos: 'SOS - URGENCE',
    fall: 'Chute detectee',
    anomaly: 'Anomalie detectee',
    intervention: 'Intervention requise',
    guardian_request: 'Demande de gardien',
  };
  sendLocalNotification(titles[alertType] || 'Alerte CHUTEX', message);
}

export function notifyIntervention(beneficiaryName: string, distance?: number) {
  sendLocalNotification(
    'Intervention Care requise',
    `${beneficiaryName} a besoin d'aide${distance ? ` (${distance}km)` : ''}. Cliquez pour intervenir.`,
  );
}
