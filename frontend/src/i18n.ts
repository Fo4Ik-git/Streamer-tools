import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "dashboard": "Dashboard",
      "modules": "Modules",
      "integrations": "Integrations",
      "settings": "Settings",
      "connected": "Connected",
      "disconnected": "Disconnected",
      "connect": "Connect",
      "disconnect": "Disconnect",
      "status": "Status",
      "server_logs": "Server Logs",
      "theme_dark": "Dark Theme",
      "theme_light": "Light Theme",
      "language": "Language",
      "welcome": "Welcome back",
      "active_modules": "Active Modules",
      "cpu_usage": "CPU Usage",
      "memory_usage": "Memory Usage",
      "integrations_desc": "Manage your external connections",
      "no_integrations": "No integrations available",
      "configure": "Configure"
    }
  },
  ua: {
    translation: {
      "dashboard": "Дашборд",
      "modules": "Модулі",
      "integrations": "Інтеграції",
      "settings": "Налаштування",
      "connected": "Підключено",
      "disconnected": "Відключено",
      "connect": "Підключити",
      "disconnect": "Відключити",
      "status": "Статус",
      "server_logs": "Логи Сервера",
      "theme_dark": "Темна тема",
      "theme_light": "Світла тема",
      "language": "Мова",
      "welcome": "З поверненням",
      "active_modules": "Активні модулі",
      "cpu_usage": "Використання CPU",
      "memory_usage": "Використання пам'яті",
      "integrations_desc": "Керування зовнішніми з'єднаннями",
      "no_integrations": "Немає доступних інтеграцій",
      "configure": "Налаштувати"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en", // default language
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
