// Push Notification Service for CHUTEX - Expo Push + Web fallback
import { Platform } from 'react-native';

let Notifications: any = null;
let permissionGranted = false;
let expoPushToken: string | null = null;
let handlerConfigured = false;

// Lazy load expo-notifications (must not import at module load time on native - crashes with New Arch)
function getNotifications() {
  if (!Notifications && Platform.OS !== 'web') {
    try {
      Notifications = require('expo-notifications');
    } catch (e) {
      console.warn('expo-notifications not available:', e);
    }
  }
  return Notifications;
}

// Lazy configure notification handler
function ensureNotificationHandler() {
  if (handlerConfigured || Platform.OS === 'web') return;
  const N = getNotifications();
  if (!N) return;
  handlerConfigured = true;
  N.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

// ─── Register for Push Notifications ───
export async function registerForPushNotifications(apiUrl: string, token: string): Promise<string | null> {
  ensureNotificationHandler();
  if (Platform.OS === 'web') {
    await requestWebNotificationPermission();
    return null;
  }

  try {
    const Device = require('expo-device');
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }
  } catch {}

  try {
    const N = getNotifications();
    if (!N) return null;
    const { status: existingStatus } = await N.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await N.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') return null;

    const tokenData = await N.getExpoPushTokenAsync({
      projectId: '6095040a-fe78-4b71-ae8f-bd1d82f93ef3',
    });
    expoPushToken = tokenData.data;

    try {
      await fetch(`${apiUrl}/api/push/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ push_token: expoPushToken }),
      });
    } catch (e) {
      console.error('Failed to register push token:', e);
    }

    if (Platform.OS === 'android') {
      await N.setNotificationChannelAsync('sos', { name: 'Alertes SOS', importance: N.AndroidImportance.MAX, vibrationPattern: [0, 250, 250, 250], sound: 'default' });
      await N.setNotificationChannelAsync('health', { name: 'Seuils de sante', importance: N.AndroidImportance.HIGH, sound: 'default' });
      await N.setNotificationChannelAsync('reminders', { name: 'Rappels', importance: N.AndroidImportance.DEFAULT, sound: 'default' });
      await N.setNotificationChannelAsync('battery', { name: 'Batterie', importance: N.AndroidImportance.LOW });
    }

    return expoPushToken;
  } catch (error) {
    console.error('Push registration error:', error);
    return null;
  }
}

// ─── Web Notification Permission ───
async function requestWebNotificationPermission(): Promise<boolean> {
  try {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') { permissionGranted = true; return true; }
    if (Notification.permission === 'denied') return false;
    const result = await Notification.requestPermission();
    permissionGranted = result === 'granted';
    return permissionGranted;
  } catch { return false; }
}

// Keep backward compatibility
export async function requestNotificationPermission(): Promise<boolean> {
  ensureNotificationHandler();
  if (Platform.OS === 'web') return requestWebNotificationPermission();
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

// ─── Send Local Notification (Web + Native) ───
export function sendLocalNotification(title: string, body: string, icon?: string) {
  ensureNotificationHandler();
  if (Platform.OS === 'web') {
    try {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      new Notification(title, { body, icon: icon || '/favicon.ico', tag: `chutex-${Date.now()}` });
    } catch {}
  } else {
    Notifications.scheduleNotificationAsync({
      content: { title, body, sound: 'default' },
      trigger: null,
    }).catch(() => {});
  }
}

// ─── Schedule Reminder Notification (Native only) ───
export async function scheduleReminderNotification(title: string, body: string, hour: number, minute: number, weekdays?: number[]) {
  if (Platform.OS === 'web') return null;
  ensureNotificationHandler();
  
  try {
    const trigger: any = { hour, minute, repeats: true };
    if (weekdays && weekdays.length > 0) {
      // Schedule for each weekday
      const ids = [];
      for (const day of weekdays) {
        const id = await Notifications.scheduleNotificationAsync({
          content: { title, body, sound: 'default', categoryIdentifier: 'reminder' },
          trigger: { ...trigger, weekday: day },
        });
        ids.push(id);
      }
      return ids;
    }
    
    return await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: 'default', categoryIdentifier: 'reminder' },
      trigger,
    });
  } catch { return null; }
}

// ─── Reminder Checker (Web fallback) ───
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
        const typeLabels: Record<string, string> = { hydration: 'Hydratation', medication: 'Traitement', alarm: 'Rappel' };
        sendLocalNotification(`${typeLabels[r.reminder_type] || 'Rappel'} - CHUTEX`, r.title + (r.dosage ? ` (${r.dosage})` : ''));
      }
    }
  }, 60000);
  return () => clearInterval(checkInterval);
}

// ─── Alert Notifications ───
export function notifyAlert(alertType: string, message: string) {
  const titles: Record<string, string> = {
    sos: 'SOS - URGENCE', fall: 'Chute detectee', anomaly: 'Anomalie detectee',
    intervention: 'Intervention requise', guardian_request: 'Demande de gardien',
  };
  sendLocalNotification(titles[alertType] || 'Alerte CHUTEX', message);
}

export function notifyIntervention(beneficiaryName: string, distance?: number) {
  sendLocalNotification('Intervention Care requise', `${beneficiaryName} a besoin d'aide${distance ? ` (${distance}km)` : ''}. Cliquez pour intervenir.`);
}

// ─── Notification Listeners (for navigation on tap) ───
export function addNotificationResponseListener(callback: (response: Notifications.NotificationResponse) => void) {
  if (Platform.OS === 'web') return { remove: () => {} };
  ensureNotificationHandler();
  return Notifications.addNotificationResponseReceivedListener(callback);
}

export function addNotificationReceivedListener(callback: (notification: Notifications.Notification) => void) {
  if (Platform.OS === 'web') return { remove: () => {} };
  ensureNotificationHandler();
  return Notifications.addNotificationReceivedListener(callback);
}
