import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';

console.log("i18n config loaded");

i18n
  .use(Backend)
  .use(initReactI18next)
  .init({
    lng: 'en',
    fallbackLng: 'en',
    backend: {
      // IMPORTANT: path must match your file names
      loadPath: '/locals/{{lng}}.json'
    },
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
