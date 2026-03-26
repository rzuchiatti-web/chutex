import { Platform } from 'react-native';

export const HEALTH_IMAGES = {
  heart: 'https://customer-assets.emergentagent.com/job_1026023a-fd73-4c44-a002-9618d437c4c8/artifacts/u3ch46l8_hearth%20red%20app%20healthbeat%20Chutex.png',
  blood: 'https://customer-assets.emergentagent.com/job_1026023a-fd73-4c44-a002-9618d437c4c8/artifacts/v87wurbk_blood%20red%20app%20health%20Chutex.png',
  sleep: 'https://customer-assets.emergentagent.com/job_1026023a-fd73-4c44-a002-9618d437c4c8/artifacts/tide9bdl_Moon%20sleep%20analys%20app%20health%20Chutex.png',
  physical: 'https://customer-assets.emergentagent.com/job_1026023a-fd73-4c44-a002-9618d437c4c8/artifacts/h37k6apj_physical%20health%20analys%20app%20health%20Chutex.png',
};

export const REMINDER_IMAGES = {
  hydration: 'https://customer-assets.emergentagent.com/job_1026023a-fd73-4c44-a002-9618d437c4c8/artifacts/7s8stuxi_hydratation.png',
  medication: 'https://customer-assets.emergentagent.com/job_1026023a-fd73-4c44-a002-9618d437c4c8/artifacts/y3xje768_traitement.png',
  alarm: 'https://customer-assets.emergentagent.com/job_1026023a-fd73-4c44-a002-9618d437c4c8/artifacts/hzoi0qcr_alarmes.png',
};

export const isDarkMode = false;

export const CHX = {
  bg: isDarkMode ? '#0b0f16' : '#f5f7fa',
  fg: isDarkMode ? '#f4f7ff' : '#0f172a',
  fgSub: isDarkMode ? 'rgba(255,255,255,.68)' : 'rgba(0,0,0,.58)',
  fgMuted: isDarkMode ? 'rgba(255,255,255,.45)' : 'rgba(0,0,0,.35)',
  border: isDarkMode ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.08)',
  cardBg: isDarkMode ? 'linear-gradient(180deg, rgba(255,255,255,.05), rgba(255,255,255,.02))' : 'linear-gradient(180deg, rgba(255,255,255,.76), rgba(255,255,255,.54))',
  headerBg: isDarkMode
    ? 'linear-gradient(145deg, rgba(255,255,255,.10), rgba(255,255,255,.04)), radial-gradient(120% 120% at 12% 10%, #35507f 0%, #23355b 45%, #1a2742 100%)'
    : 'linear-gradient(145deg, rgba(255,255,255,.25), rgba(255,255,255,.18)), radial-gradient(140% 140% at 10% 10%, #ffb187 0%, #f39c70 30%, #cc9fbe 64%, #a9b8ea 100%)',
  bgClass: isDarkMode ? 'chx-bg-dark' : 'chx-bg-light',
  cardClass: isDarkMode ? 'chx-card-dark' : 'chx-card-light',
  headerClass: isDarkMode ? 'chx-header-dark' : 'chx-header-light',
  btnClass: isDarkMode ? 'chx-btn chx-btn-dark-primary' : 'chx-btn chx-btn-light-primary',
  btnDangerClass: isDarkMode ? 'chx-btn chx-btn-dark-danger' : 'chx-btn chx-btn-light-danger',
};

export const webShadow: any = Platform.OS === 'web' ? { boxShadow: '0 12px 28px rgba(0,0,0,.18)' } : { shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.18, shadowRadius: 28, elevation: 4 };
export const webGlass: any = Platform.OS === 'web' ? { backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)' } : {};

export const BG_IMAGES = {
  beneficiary: 'https://customer-assets.emergentagent.com/job_9950a869-9328-4a4b-abf4-a6fb213a3b47/artifacts/iklovqya_background_beneficiary.svg',
  red: 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/mhh7xwy3_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2014_08_43.png',
  dashboard: 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/j2b92wwx_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2015_59_23.png',
  violet: 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/v6obzpez_ChatGPT%20Image%2018%20f%C3%A9vr.%202026%2C%2012_28_20.png',
  orange: 'https://customer-assets.emergentagent.com/job_443c9c6e-0feb-4920-a358-fe7cc1a6289b/artifacts/1lq6xl58_ChatGPT%20Image%2017%20f%C3%A9vr.%202026%2C%2008_54_55.png',
  gold: 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/s2281oc6_ChatGPT%20Image%2018%20f%C3%A9vr.%202026%2C%2012_16_35.png',
  saad: 'https://customer-assets.emergentagent.com/job_8afdc991-0ab2-4687-a2a5-438b9a5f0711/artifacts/uvntv6me_ChatGPT%20Image%2018%20f%C3%A9vr.%202026%2C%2008_31_33.png',
};
