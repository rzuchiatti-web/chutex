// Live Activity Service - Bridge to iOS ActivityKit
// Provides in-app fallback for Android/Web and native Live Activities on iOS
import { Platform, NativeModules } from 'react-native';

const { LiveActivityModule } = NativeModules || {};

export interface LiveActivityData {
  alertId: string;
  beneficiaryName: string;
  alertType: string;
  alertTypeLabel: string;
}

export interface LiveActivityUpdate {
  currentStage: string;
  stageMessage: string;
  intervenantName?: string;
  etaMinutes?: number;
  stagesCompleted: string[];
}

/**
 * Start a Live Activity on iOS (Lock Screen + Dynamic Island)
 * Falls back gracefully on Android/Web
 */
export async function startLiveActivity(data: LiveActivityData): Promise<{ activityId?: string; supported: boolean }> {
  if (Platform.OS !== 'ios' || !LiveActivityModule) {
    return { supported: false };
  }
  try {
    const result = await LiveActivityModule.startAlertActivity(
      data.alertId,
      data.beneficiaryName,
      data.alertType,
      data.alertTypeLabel
    );
    return { activityId: result.activityId, supported: true };
  } catch (e) {
    console.warn('Live Activity start failed:', e);
    return { supported: false };
  }
}

/**
 * Update a Live Activity on iOS
 */
export async function updateLiveActivity(alertId: string, update: LiveActivityUpdate): Promise<boolean> {
  if (Platform.OS !== 'ios' || !LiveActivityModule) return false;
  try {
    await LiveActivityModule.updateAlertActivity(
      alertId,
      update.currentStage,
      update.stageMessage,
      update.intervenantName || null,
      update.etaMinutes || null,
      update.stagesCompleted
    );
    return true;
  } catch {
    return false;
  }
}

/**
 * End a Live Activity on iOS
 */
export async function endLiveActivity(alertId: string): Promise<boolean> {
  if (Platform.OS !== 'ios' || !LiveActivityModule) return false;
  try {
    await LiveActivityModule.endAlertActivity(alertId);
    return true;
  } catch {
    return false;
  }
}
