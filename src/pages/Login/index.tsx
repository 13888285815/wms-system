import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User } from '../../types';
import { store } from '../../store';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input, Select } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { LogIn, ShieldCheck, User as UserIcon, Lock } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginProps> = ({ onLogin }) => {
  const { t } = useTranslation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const user = store.login(username, password);
      if (user) {
        onLogin(user);
      } else {
        setError(t('Invalid username or password'));
      }
    } catch (err) {
      setError(t('An error occurred during login'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 hover:shadow-blue-500/20">
          <div className="p-8">
            <div className="flex flex-col items-center mb-8">
              <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-4 text-blue-600 shadow-inner">
                <ShieldCheck size={36} />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">WMS Cloud</h1>
              <p className="text-gray-500 text-sm mt-1">{t('Warehouse Management System')}</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              <div className="relative">
                <div className="absolute left-3 top-9 text-gray-400 z-10">
                  <UserIcon size={18} />
                </div>
                <Input
                  label={t('Username')}
                  placeholder={t('Enter your username')}
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="relative">
                <div className="absolute left-3 top-9 text-gray-400 z-10">
                  <Lock size={18} />
                </div>
                <Input
                  label={t('Password')}
                  type="password"
                  placeholder={t('Enter your password')}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer transition-colors"
                  />
                  <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{t('Remember me')}</span>
                </label>
                <button type="button" className="text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors">
                  {t('Forgot password?')}
                </button>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm animate-shake">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full justify-center py-2.5 text-base font-semibold shadow-lg shadow-blue-500/30"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t('Signing in...')}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <LogIn size={20} />
                    {t('Sign In')}
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('Demo Account')}</p>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">{t('Username')}: <code className="bg-white px-1.5 py-0.5 rounded border text-blue-600">admin</code></span>
                  <span className="text-gray-600">{t('Password')}: <code className="bg-white px-1.5 py-0.5 rounded border text-blue-600">123456</code></span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <p className="text-center text-white/60 text-xs mt-8">
          &copy; 2024 WMS Cloud System. All rights reserved.
        </p>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.2s ease-in-out 0s 2;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
