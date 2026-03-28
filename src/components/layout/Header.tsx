import React from 'react';
import { useTranslation } from 'react-i18next';
import { Menu, Globe } from 'lucide-react';
import { LANGUAGES } from '../../i18n';
import i18n from '../../i18n';

interface HeaderProps {
  title: string;
  onMenuClick: () => void;
}

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

  const currentLang = LANGUAGES.find(l => l.code === i18nHook.language) || LANGUAGES[0];

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-4 gap-4 sticky top-0 z-20">
      <button onClick={onMenuClick} className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors">
        <Menu size={20} className="text-gray-600" />
      </button>

      <h1 className="flex-1 text-lg font-semibold text-gray-800">{title}</h1>

      <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 rounded-lg border border-purple-200 text-xs">
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
      <div className="relative">
        <button
          onClick={() => setLangOpen(!langOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-sm"
        >
          <Globe size={16} className="text-gray-500" />
          <span>{currentLang.label}</span>
        </button>

        {langOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setLangOpen(false)} />
            <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-lg border border-gray-100 py-1 min-w-[140px] z-50">
              {LANGUAGES.map(lang => (
                <button
                  key={lang.code}
                  onClick={() => handleLangChange(lang.code)}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 transition-colors ${lang.code === i18nHook.language ? 'text-blue-600 font-medium bg-blue-50' : 'text-gray-700'}`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </header>
  );
};
