import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Upload, RotateCcw, Shield, Database } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { store } from '../../store';
import { LANGUAGES } from '../../i18n';
import i18n from '../../i18n';

export const SettingsPage: React.FC = () => {
  const { t, i18n: i18nHook } = useTranslation();
  const [message, setMessage] = useState('');

  const showMsg = (msg: string) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleExport = () => {
    const data = store.exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wms-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showMsg('数据已导出');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          store.importData(ev.target?.result as string);
          showMsg('数据导入成功，请刷新页面');
          setTimeout(() => window.location.reload(), 1500);
        } catch {
          showMsg('导入失败：文件格式错误');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleReset = () => {
    if (window.confirm('确认重置所有数据？这将清除所有自定义数据并恢复演示数据。')) {
      store.resetData();
      showMsg('数据已重置');
      setTimeout(() => window.location.reload(), 1000);
    }
  };

  const handleLangChange = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('wms_language', code);
    const lang = LANGUAGES.find(l => l.code === code);
    document.documentElement.dir = lang?.dir || 'ltr';
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {message && (
        <div className="fixed top-20 right-6 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 text-sm">
          {message}
        </div>
      )}

      {/* Language */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield size={20} className="text-blue-600" />
          <h2 className="text-base font-semibold text-gray-900">显示语言 / Language</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              onClick={() => handleLangChange(lang.code)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-all ${
                i18nHook.language === lang.code
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-blue-400 hover:text-blue-600'
              }`}
            >
              {lang.label}
            </button>
          ))}
        </div>
      </div>

      {/* Data Management */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Database size={20} className="text-green-600" />
          <h2 className="text-base font-semibold text-gray-900">数据管理 / Data Management</h2>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          数据存储在浏览器本地（localStorage）。导出备份可在不同设备间分享数据。
        </p>
        <div className="flex flex-wrap gap-3">
          <Button onClick={handleExport} variant="secondary">
            <Download size={16} />
            导出备份 (JSON)
          </Button>
          <Button onClick={handleImport} variant="secondary">
            <Upload size={16} />
            导入数据
          </Button>
          <Button onClick={handleReset} variant="danger">
            <RotateCcw size={16} />
            重置演示数据
          </Button>
        </div>
      </div>

      {/* About */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-3">关于系统</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex gap-3"><dt className="text-gray-500 w-24">版本</dt><dd className="text-gray-900">v1.0.0</dd></div>
          <div className="flex gap-3"><dt className="text-gray-500 w-24">技术栈</dt><dd className="text-gray-900">React + TypeScript + Tailwind CSS + Vite</dd></div>
          <div className="flex gap-3"><dt className="text-gray-500 w-24">部署</dt><dd className="text-gray-900">Vercel / GitHub Pages</dd></div>
          <div className="flex gap-3"><dt className="text-gray-500 w-24">数据存储</dt><dd className="text-gray-900">浏览器 localStorage（无需后端）</dd></div>
          <div className="flex gap-3"><dt className="text-gray-500 w-24">多语言</dt><dd className="text-gray-900">中文、English、Français、Deutsch、日本語、العربية</dd></div>
        </dl>
      </div>
    </div>
  );
};
