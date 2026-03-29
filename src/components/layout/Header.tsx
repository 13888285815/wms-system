import React from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, Globe, ChevronDown } from 'lucide-react';
import { LANGUAGES } from '../../i18n';
import i18n from '../../i18n';
import { subscriptionStore } from '../../store/subscription';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
}

const LANGUAGE_FLAGS: Record<string, string> = {
  zh: '🇨🇳',
  en: '🇺🇸',
  fr: '🇫🇷',
  de: '🇩🇪',
  ja: '🇯🇵',
  ar: '🇸🇦'
};

export const Header: React.FC<HeaderProps> = ({ title, onMenuClick }) => {
  const { i18n: i18nHook } = useTranslation();
  const [langOpen, setLangOpen] = React.useState(false);

  const handleLangChange = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('wms_language', code);
    const lang = LANGUAGES.find(l => l.code === code);
    document.documentElement.dir = lang?.dir || 'ltr';
    document.documentElement.lang = code;
    setLangOpen(false);
  };

  const currentLangCode = i18nHook.language || 'zh';
  const currentLang = LANGUAGES.find(l => l.code === currentLangCode) || LANGUAGES[0];

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 gap-4 sticky top-0 z-20">
      <button 
        onClick={onMenuClick} 
        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Toggle Menu"
      >
        <Menu size={20} className="text-gray-600" />
      </button>

      <h1 className="flex-1 text-lg font-semibold text-gray-800 truncate">{title}</h1>

      <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 rounded-lg border border-purple-200 text-xs shrink-0">
        <span className="text-purple-600 font-medium">⚡</span>
        <span className="text-purple-700 font-semibold">
          {subscriptionStore.getTokensAvailable() === Infinity 
            ? '∞' 
            : subscriptionStore.getTokensAvailable().toLocaleString()
          }
        </span>
        <span className="text-purple-500">tokens</span>
      </div>

      {/* Language selector */}
      <div className="relative shrink-0">
        <button
          onClick={() => setLangOpen(!langOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm min-w-[110px] justify-between"
        >
          <div className="flex items-center gap-2">
            <span className="text-base leading-none">{LANGUAGE_FLAGS[currentLangCode] || '🌐'}</span>
            <span className="hidden md:inline">{currentLang.label}</span>
          </div>
          <ChevronDown size={14} className={`text-gray-400 transition-transform ${langOpen ? 'rotate-180' : ''}`} />
        </button>

        {langOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
            <div className={`absolute top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[160px] z-50 ${document.documentElement.dir === 'rtl' ? 'left-0' : 'right-0'}`}>
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => handleLangChange(lang.code)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors ${lang.code === currentLangCode ? 'text-blue-600 font-medium bg-blue-50' : 'text-gray-700'}`}
                >
                  <span className="text-base leading-none">{LANGUAGE_FLAGS[lang.code]}</span>
                  <span>{lang.label}</span>
                  {lang.code === currentLangCode && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-600" />
                  )}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </header>
  );
};
