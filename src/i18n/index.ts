import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zh from './locales/zh.json';
import en from './locales/en.json';
import fr from './locales/fr.json';
import de from './locales/de.json';
import ja from './locales/ja.json';
import ar from './locales/ar.json';

export const LANGUAGES = [
  { code: 'zh', label: '中文', dir: 'ltr' },
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'fr', label: 'Français', dir: 'ltr' },
  { code: 'de', label: 'Deutsch', dir: 'ltr' },
  { code: 'ja', label: '日本語', dir: 'ltr' },
  { code: 'ar', label: 'العربية', dir: 'rtl' },
];

const savedLang = localStorage.getItem('wms_language') || 'zh';

i18n.use(initReactI18next).init({
  resources: { 
    zh: { translation: zh }, 
    en: { translation: en }, 
    fr: { translation: fr }, 
    de: { translation: de }, 
    ja: { translation: ja }, 
    ar: { translation: ar } 
  },
  lng: savedLang,
  fallbackLng: 'zh',
  interpolation: { escapeValue: false },
});

// Apply RTL/LTR on init
const initLang = LANGUAGES.find(l => l.code === savedLang);
document.documentElement.dir = initLang?.dir || 'ltr';
document.documentElement.lang = savedLang;

export default i18n;
