import { StyleSheet, Platform, Alert } from 'react-native';
import { Colors } from '../../constants/colors';

export const confirmAction = (title: string, message: string, onConfirm: () => void) => {
  if (Platform.OS === 'web') {
    if (window.confirm(`${title}\n\n${message}`)) onConfirm();
  } else {
    Alert.alert(title, message, [{ text: 'Annuler', style: 'cancel' }, { text: 'Confirmer', style: 'destructive', onPress: onConfirm }]);
  }
};

export const getCleanLabel = (alertType: string, message?: string) => {
  if (alertType === 'fall') return 'Chute detectee';
  if (alertType === 'sos') return 'SOS';
  if (alertType === 'heart_rate' || alertType === 'health_anomaly') return 'Anomalie de sante detectee';
  if (alertType === 'spo2') return 'Anomalie de sante detectee';
  if (alertType === 'inactivity') return 'Inactivite detectee';
  if (message) {
    if (message.toLowerCase().includes('chute')) return 'Chute detectee';
    if (message.toLowerCase().includes('sos')) return 'SOS';
  }
  return alertType || 'Alerte';
};

export const BG_BLUE = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/v5t9l2mb_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_10_07.png';
export const BG_VIOLET = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/v6obzpez_ChatGPT%20Image%2018%20f%C3%A9vr.%202026%2C%2012_28_20.png';
export const BG_GREEN = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/uvntv6me_ChatGPT%20Image%2018%20f%C3%A9vr.%202026%2C%2008_31_33.png';
export const BG_TA = 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/j2b92wwx_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2015_59_23.png';
export const BG_RED_TA = 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/mhh7xwy3_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_08_43.png';
export const LOGO_URL = 'https://cdn.shopify.com/s/files/1/0886/1918/8558/files/Logo_chutex_1.png?v=1737551429';

export const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#FFFFFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 12, color: Colors.textMuted, marginTop: 2, letterSpacing: 0.3 },
  sc: { paddingHorizontal: 20, paddingBottom: 30 },
  prog: { flexDirection: 'row', justifyContent: 'center', gap: 5, marginBottom: 4 },
  progDot: { width: 24, height: 3, borderRadius: 2, backgroundColor: Colors.border },
  stepL: { fontSize: 11, color: Colors.textMuted, textAlign: 'center', marginBottom: 12 },
  qCard: { backgroundColor: Colors.subtle, borderRadius: 14, padding: 16, marginBottom: 12 },
  qLabel: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12 },
  qItem: { marginBottom: 16 },
  qText: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, marginBottom: 12, lineHeight: 22 },
  optBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, marginBottom: 6, gap: 10 },
  optBtnA: { borderColor: Colors.primary, backgroundColor: Colors.primary + '08' },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: Colors.border, justifyContent: 'center', alignItems: 'center' },
  radioA: { borderColor: Colors.primary },
  radioI: { width: 9, height: 9, borderRadius: 5, backgroundColor: Colors.primary },
  optT: { fontSize: 14, color: Colors.textSecondary, flex: 1 },
  optTA: { color: Colors.textPrimary, fontWeight: '600' },
  scaleC: { alignItems: 'center' },
  scaleV: { fontSize: 32, fontWeight: '800', color: Colors.textPrimary, marginBottom: 10 },
  scaleR: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 5 },
  scaleB: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.subtle, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  scaleBT: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  textInp: { backgroundColor: Colors.subtle, borderRadius: 10, padding: 14, fontSize: 14, color: Colors.textPrimary, minHeight: 80, textAlignVertical: 'top', borderWidth: 1, borderColor: Colors.border, marginBottom: 12 },
  navR: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  prevB: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, backgroundColor: Colors.subtle },
  prevBT: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  nextB: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, backgroundColor: Colors.primary },
  nextBT: { fontSize: 13, fontWeight: '600', color: '#FFF' },
  submitB: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 10, paddingHorizontal: 16, borderRadius: 10, backgroundColor: Colors.primary },
  submitBT: { fontSize: 13, fontWeight: '600', color: '#FFF' },
  successCard: { backgroundColor: Colors.subtle, borderRadius: 16, padding: 24, alignItems: 'center', marginTop: 16 },
  successT: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, marginTop: 10 },
  successSub: { fontSize: 13, color: Colors.textSecondary, marginTop: 4 },
  callCard: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: Colors.paper, borderWidth: 1, borderColor: Colors.border, paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12, marginTop: 16 },
  callNum: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  newBtn: { marginTop: 16, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10, backgroundColor: Colors.subtle, borderWidth: 1, borderColor: Colors.border },
  newBtnT: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  escHeader: { alignItems: 'center', marginBottom: 16 },
  escPulse: { width: 56, height: 56, borderRadius: 28, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  escPulseSmall: { width: 24, height: 24, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  escTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary },
  escSub: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', marginTop: 2 },
  tlCard: { backgroundColor: Colors.subtle, borderRadius: 12, padding: 14, marginBottom: 14 },
  tlTitle: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  tlRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  tlDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4, backgroundColor: Colors.border },
  tlText: { flex: 1, fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
  actionTitle: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginBottom: 8, marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 12, marginBottom: 8 },
  actionBtnT: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  cancelBtn: { flex: 1, padding: 14, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, alignItems: 'center' },
  cancelBtnT: { fontSize: 13, color: Colors.textMuted },
  tabRow: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  tabBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, backgroundColor: Colors.subtle },
  tabBtnA: { backgroundColor: Colors.primary },
  tabBtnT: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  tabBtnTA: { color: '#FFF' },
  taAlertCard: { backgroundColor: Colors.subtle, borderRadius: 14, padding: 14, marginBottom: 10, borderLeftWidth: 3, borderLeftColor: Colors.border },
  taAlertTop: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  taAlertInfo: { flex: 1 },
  taAlertMsg: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  taAlertMeta: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  taBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: Colors.subtle, borderWidth: 1, borderColor: Colors.border },
  taBadgeT: { fontSize: 9, fontWeight: '700', color: Colors.textMuted, textTransform: 'uppercase' },
  startEscBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: Colors.primary },
  startEscBtnT: { color: '#FFF', fontSize: 13, fontWeight: '600' },
  escLogCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.subtle, borderRadius: 10, padding: 12, marginBottom: 6, gap: 10 },
  escLogDot: { width: 10, height: 10, borderRadius: 5 },
  escLogInfo: { flex: 1 },
  escLogName: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary },
  escLogRes: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  escLogDate: { fontSize: 10, color: Colors.textMuted },
  emptyC: { alignItems: 'center', paddingVertical: 36 },
  emptyT: { fontSize: 13, color: Colors.textMuted, marginTop: 8 },
  ivCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.subtle, borderRadius: 10, padding: 12, marginBottom: 6, gap: 10 },
  ivDot: { width: 10, height: 10, borderRadius: 5 },
  ivInfo: { flex: 1 },
  ivName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  ivSt: { fontSize: 11, color: Colors.textMuted, marginTop: 1 },
  adminCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.subtle, borderRadius: 14, padding: 16, marginBottom: 10, gap: 12 },
  adminInfo: { flex: 1 },
  adminLabel: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  adminDesc: { fontSize: 12, color: Colors.textMuted, marginTop: 2 },
  secTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary, marginTop: 16, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  careCard: { backgroundColor: Colors.subtle, borderRadius: 14, padding: 24, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: Colors.border },
  careTitle: { fontSize: 18, fontWeight: '800', color: Colors.textPrimary, marginTop: 10 },
  careDesc: { fontSize: 13, color: Colors.textSecondary, textAlign: 'center', lineHeight: 19, marginTop: 8, marginBottom: 16 },
  careRow: { flexDirection: 'row', gap: 8, width: '100%' },
  careInput: { flex: 1, backgroundColor: Colors.paper, borderRadius: 10, padding: 14, fontSize: 15, fontWeight: '600', color: Colors.text, borderWidth: 1, borderColor: Colors.border, textAlign: 'center', letterSpacing: 2 },
  careBtn: { paddingHorizontal: 20, borderRadius: 10, backgroundColor: Colors.primary, justifyContent: 'center' },
  careBtnT: { fontSize: 14, fontWeight: '700', color: '#FFF' },
  careActive: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: Colors.success + '12', borderRadius: 10, padding: 14, marginBottom: 14 },
  careActiveT: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  careActiveSub: { fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  modalO: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalC: { backgroundColor: Colors.paper, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, maxHeight: '85%' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.text, marginBottom: 12 },
  modalInput: { backgroundColor: Colors.subtle, borderRadius: 8, padding: 12, fontSize: 14, color: Colors.text, borderWidth: 1, borderColor: Colors.border },
  modalBtns: { flexDirection: 'row', gap: 12, marginTop: 16 },
  confirmBtn: { flex: 1, padding: 14, borderRadius: 10, backgroundColor: Colors.primary, alignItems: 'center' },
});
