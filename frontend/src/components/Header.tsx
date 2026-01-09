import { Globe, Moon, Sun, Wifi, WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSocket } from '../context/SocketContext';
import { useTheme } from '../context/ThemeContext';

export const Header = () => {
    const { t, i18n } = useTranslation();
    const { theme, toggleTheme } = useTheme();
    const { status } = useSocket();

    const toggleLanguage = () => {
        const nextLang = i18n.language === 'en' ? 'ua' : 'en';
        i18n.changeLanguage(nextLang);
    };

    return (
        <header className="h-16 border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm flex items-center justify-between px-6 dark:bg-slate-900/50 bg-white/50 dark:border-slate-700 border-gray-200 transition-colors duration-300">
             
            <div className="flex items-center gap-2">
                 <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                    status === 'Connected' 
                    ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                    : 'bg-red-500/10 text-red-500 border border-red-500/20'
                 }`}>
                    {status === 'Connected' ? <Wifi size={14} /> : <WifiOff size={14} />}
                    {status === 'Connected' ? t('connected') : t('disconnected')}
                 </div>
            </div>

            <div className="flex items-center gap-4">
                <button 
                  onClick={toggleLanguage}
                  className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors dark:hover:bg-slate-800 hover:bg-gray-100 dark:text-slate-400 text-gray-600"
                  title={t('language')}
                >
                   <span className="flex items-center gap-2 font-medium text-sm">
                     <Globe size={18} />
                     {i18n.language.toUpperCase()}
                   </span>
                </button>

                <button 
                  onClick={toggleTheme}
                  className="p-2 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors dark:hover:bg-slate-800 hover:bg-gray-100 dark:text-slate-400 text-gray-600"
                  title={theme === 'dark' ? t('theme_light') : t('theme_dark')}
                >
                    {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>
            </div>
        </header>
    );
};
