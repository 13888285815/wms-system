import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { store } from '../../store';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LogIn, ShieldCheck, User as UserIcon, Lock, AlertCircle } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

const LoginPage: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [failCount, setFailCount] = useState(0);
  const [lockoutTime, setLockoutTime] = useState(0);

  // Handle lockout countdown
  useEffect(() => {
    if (lockoutTime > 0) {
      const timer = setInterval(() => {
        setLockoutTime(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [lockoutTime]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lockoutTime > 0) return;

    setError('');
    setLoading(true);

    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { user, rateLimited } = store.login(username, password);
      
      if (rateLimited) {
        setError('由于尝试次数过多，该账号已被暂时锁定');
        setLockoutTime(60);
        return;
      }

      if (user) {
        onLogin(user);
      } else {
        const newCount = failCount + 1;
        setFailCount(newCount);
        if (newCount >= 3) {
          setError('登录失败次数过多，请等待 60 秒后重试');
          setLockoutTime(60);
          setFailCount(0);
        } else {
          setError(`用户名或密码错误 (剩余尝试次数: ${3 - newCount})`);
        }
      }
    } catch (err) {
      setError('登录过程中发生错误，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 p-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 rounded-full blur-[120px]" />
      
      <div className="w-full max-w-md z-10">
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl shadow-2xl overflow-hidden">
          <div className="p-10">
            <div className="flex flex-col items-center mb-10">
              <div className="w-20 h-20 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-500/20">
                <ShieldCheck size={42} className="text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white tracking-tight">意念ERP</h1>
              <p className="text-white/50 text-sm mt-2">新一代云端企业资源管理系统</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-blue-400 transition-colors">
                  <UserIcon size={20} />
                </div>
                <input
                  type="text"
                  placeholder="用户名"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={lockoutTime > 0}
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
              </div>

              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 group-focus-within:text-blue-400 transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  type="password"
                  placeholder="密码"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={lockoutTime > 0}
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 text-white placeholder-white/30 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
              </div>

              <div className="flex items-center justify-between px-1">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-white/20 bg-white/5 text-blue-500 focus:ring-blue-500/50 cursor-pointer"
                  />
                  <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">记住我</span>
                </label>
                <button type="button" className="text-sm text-blue-400 hover:text-blue-300 font-medium transition-colors">
                  忘记密码？
                </button>
              </div>

              {error && (
                <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-3 animate-in fade-in slide-in-from-top-1">
                  <AlertCircle size={18} className="shrink-0 mt-0.5" />
                  <span>{error} {lockoutTime > 0 && `(请等待 ${lockoutTime} 秒)`}</span>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading || lockoutTime > 0}
                className="w-full justify-center py-4 text-lg font-bold bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>正在登录...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <LogIn size={22} />
                    <span>立即进入系统</span>
                  </div>
                )}
              </Button>
            </form>

            <div className="mt-10 pt-8 border-t border-white/10">
              <div className="p-5 bg-white/5 rounded-2xl border border-white/5 space-y-3">
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em]">演示账号预览</p>
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-white/50">管理员帐号</span>
                    <code className="text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">admin</code>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-white/50">通用密码</span>
                    <code className="text-blue-400 bg-blue-400/10 px-2 py-0.5 rounded">123456</code>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <p className="text-center text-white/30 text-xs mt-10 tracking-widest font-light">
          &copy; 2026 云南意念科技有限公司
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
